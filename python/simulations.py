from __future__ import division
import numpy as np
from scipy import optimize
import math
import random
import copy as cp
import os
import matplotlib.pyplot as plt
import matplotlib.image as mpimg
from matplotlib.offsetbox import AnnotationBbox, OffsetImage
from matplotlib._png import read_png

import seaborn as sns
sns.set(color_codes=True)


parameterHeader = '\n-f(x)\tp\tl1\tl2\tpN\tl1N\tl2N'
valuesHeader = '\tqd_pl\tqd_bp\tqd_bl'
hLine = '\n-----------------------------------------------------------------------------'
fileHeader = parameterHeader + valuesHeader + hLine

total = 100
Nparameters = 6
Nevaluations = 3
rounding = 4
topScenarios = 15
footerTxt = ''
stim = [['b_high','b_low'],['y_high','y_low']]
bg = ['h1', 'h2', 'h3']
condNames = ['bl, pr, lk']

typeName = ['0-low', '1-medium', '2-high']
change_var = [0.05, 0.15, 0.25]

def quadratic_divergence(P, Q):
	# compute quadratic divergence between P and Q
	P = np.array(P)
	Q = np.array(Q)
	P = P.flatten()
	Q = Q.flatten()

	if len(P) != len(Q):
		return 0 

	QD_PQ = 0
	for i in range(0, len(P)):
			QD_PQ = QD_PQ + math.pow((P[i] - Q[i]),2)
	return QD_PQ

def prior_penalty(p, exp):
	return math.pow(2*(p - 0.5), 2*exp)

def change_penalty(qd, h, a=-8, maxY=1):
	pp = math.sqrt(-maxY/a)
	ns = [h-pp,h+pp]
	if ns[0] > qd or qd > ns[1]:
		return 0.0
	else:
		return a * math.pow((qd - h), 2) + maxY

def print_change_penalty():
	xx = np.linspace(0.0, 4.0, num=500)
	# for a in [-2, -4, -8, -16]:
	# 	yy = [change_penalty(ii, h=1, a=a) for ii in xx]
	# 	plt.plot(xx, yy, '-')
	# plt.show()
	for h in change_var:
		yy = [change_penalty(ii, h=h, a=-8) for ii in xx]
		plt.plot(xx, yy, '-', label='change=%s' % h)
	ax = plt.gca()
	ax.set_title('Low/Medium/High change goodness functions')
	ax.set_ylabel('goodness')
	ax.set_xlabel('quadratic divergence')
	legend = plt.legend()
	ax.set_ylim([0-ax.get_ylim()[1]*0.01,ax.get_ylim()[1]*1.02])
	# ax.set_xlim([ax.get_xlim()[0]*1.05,ax.get_xlim()[1]*1.05])
	plt.show()

def joint_probs(p, l1, l2):
	bigJoint = []
	joint = []
	tt = math.ceil(total * p * l1 - 0.5)

	if (total * p * l1-0.5) % 1 == 0:
		joint.append(int(tt)+1)
	else:
		joint.append(int(tt))
	joint.append(int(math.ceil(total * p * (1-l1) - 0.5)))
	bigJoint.append(joint)
	joint = []

	tt = math.ceil(total * (1-p) * l2 - 0.5)

	if (total * (1-p) * l2-0.5) % 1 == 0:
		joint.append(int(tt)+1)
	else:
		joint.append(int(tt))
	joint.append(int(math.ceil(total * (1-p) * (1-l2) - 0.5)))
	bigJoint.append(joint)
	return bigJoint

def getMatrixSize(total):
	rows = int(math.ceil(math.sqrt(total)))
	columns = int(math.ceil(total/rows))
	return rows, columns

def randomScenario(length):
	#get a random vector of length l
	x = []
	for i in range(0, length):
			x.append(random.uniform(0, 1))
	return x

def posterior(p, l1, l2):
	prior = [p,  1- p]
	like  = [[l1, l2], [1-l1, 1-l2]] 
	post = []
	for ff in [0,1]:
		posterior = []
		margin = like[ff][0] * prior[0] + like[ff][1] * prior[1]
		for i in [0,1]: 
			denom = (0 if margin == 0 else (like[ff][i] * prior[i])/margin)
			posterior.append(denom)
		post.append(posterior)
	return post

def probability_gain(p, l1, l2):
	prior = [p,  1-p]
	like  = [[l1, l2], [1-l1, 1-l2]] 
	maxk = max(prior[0], prior[1])
	post = posterior(p, l1, l2)
	temp = 0
	margin = []

	for ff in [0,1]:
		margin.append(like[ff][0] * prior[0] + like[ff][1] * prior[1])

	for ff in [0,1]:
		temp += margin[ff] * max(post[ff])
	
	return temp - maxk

def evaluate(x):
	p, l1, l2, p_new, l1_new, l2_new = x
	R = posterior(p, l1, l2)
	P = posterior(p_new, l1, l2)
	Q = posterior(p, l1_new, l2_new)
	distanceP_Q = quadratic_divergence(P, Q)
	distanceR_P = quadratic_divergence(R, P)
	distanceR_Q = quadratic_divergence(R, Q)
	return distanceP_Q, distanceR_P, distanceR_Q 

def optimization(x_initial):

	#(punish deviations from 0.0/1.0!!!)
	x = cp.copy(x_initial)
	for i in range(0, len(x)):
		x[i] = min(x[i], 1.0) # - gamma
		x[i] = max(x[i], 0.0) # + gamma
	penalty = sum([abs(i - j) for i, j in zip(x, x_initial)]) # and use x for further computation

	p, l1, l2, p_new, l1_new, l2_new = x

	#(punish extreme values!!!)
	ppenalty = 0
	for item in [p, p_new]: 
		ppenalty += prior_penalty(item, exp=8)
	for item in [l1, l2, l1_new, l2_new]: 
		ppenalty += prior_penalty(item, exp=12)

	#(compute posteriors)
	ba = posterior(p, l1, l2)
	pr = posterior(p_new, l1, l2)
	lk = posterior(p, l1_new, l2_new)

	multiplier = 10

	difference_pr_lk = (4 - quadratic_divergence(pr, lk)) ** multiplier
	difference_ba_pr = 		quadratic_divergence(ba, pr)
	difference_ba_lk =		quadratic_divergence(ba, lk)

	difference_ba_pr = change_penalty(difference_ba_pr, h=change_var[Ctype], a=-8)
	difference_ba_lk = change_penalty(difference_ba_lk, h=change_var[Ctype], a=-8)

	amount_change = (difference_ba_pr + difference_ba_lk)/2.0

	goodness = (difference_pr_lk * amount_change) ** (1/multiplier) - 10000 * penalty - ppenalty

	return (-1) * goodness 

def saveFile(results2DRandom, filename):
	file_path = 'optimization_results/%s-%s.txt' % (typeName[Ctype], filename)

	#(1) evaluation
	evaluateMatrix = np.empty((0,Nevaluations), float)
	for i, row in enumerate(results2DRandom):
		evaluateMatrix = np.vstack([evaluateMatrix, evaluate(row[1:])])
	results2DRandom = np.hstack([results2DRandom, evaluateMatrix])

	#(2) load previous file
	if os.path.exists(file_path) == False:
		oldMatrix = np.empty((0, Nparameters + Nevaluations + 1), float)
	else:
		oldMatrix = np.loadtxt(file_path)

	#(3) save new results
	newMatrix = np.vstack([oldMatrix, results2DRandom])
	newMatrix = newMatrix[newMatrix[:,0].argsort()]
	newMatrix = newMatrix[:topScenarios,:]
	np.savetxt(file_path, newMatrix, 
		header=fileHeader, footer=footerTxt, delimiter='\t', fmt='%.2f')

	return

def findRandomEnvironmnets(n):
	#(1) generate n random environments
	for i in np.arange(n):
		x = randomScenario(Nparameters)
		results_array = [round(optimization(x), rounding)]
		for item in x: results_array.append(item)
		
		if i == 0: results2DRandom = results_array
		else: results2DRandom = np.vstack([results2DRandom, results_array])
	results2DRandom = results2DRandom[results2DRandom[:,0].argsort()]
	results2DRandom = results2DRandom[:topScenarios,:]

	saveFile(results2DRandom, 'results-random')

	return

def get_best_random(n):
	#(2) load previous file
	file_path = 'optimization_results/%s-results-random.txt' % typeName[Ctype]
	if os.path.exists(file_path) == True:
		oldMatrix = np.loadtxt(file_path)
		return oldMatrix[:n,1:Nparameters+1]
	else: return

def further_optimize(x, n):
	c = 0
	for i in np.arange(n):
		print "Optimizing %s" % c
		res = optimize.basinhopping(optimization, x, niter=1000, T=1, stepsize=1)
		results_array = [round(res.fun, rounding)]
		for item in res.x:
			results_array.append(round(item, rounding))
		if i == 0: results2DRandom = results_array
		else: results2DRandom = np.vstack([results2DRandom, results_array])
		c += 1
	if n>1:
		results2DRandom = results2DRandom[results2DRandom[:,0].argsort()]
		results2DRandom = results2DRandom[:topScenarios,:]
	else: results2DRandom = [results2DRandom]

	saveFile(results2DRandom, 'results')

	return

def optimize_random(best_n, n):
	for row in get_best_random(best_n):
		further_optimize(row, n)
	return

def get_best_env(n, Ctype=0):
	#(2) load best environment file
	file_path = 'optimization_results/%s-results.txt' % typeName[Ctype]
	if os.path.exists(file_path) == True:
		oldMatrix = np.loadtxt(file_path)
		return oldMatrix[n,1:Nparameters+1]
	else: return

# Ctype = 1
# findRandomEnvironmnets(10000)
# optimize_random(10, 1)

# print joint_probs(p, l1, l2)
# print joint_probs(p_new, l1, l2)
# print joint_probs(p, l1_new, l2_new)
