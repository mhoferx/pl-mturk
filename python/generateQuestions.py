from __future__ import division
import numpy as np
import math
import random
import json
from pprint import pprint
import simulations as sim

# class question():
# 	def __init__(self, *args):
# 		if len(args) == 2: #create random environment
# 			while True:
# 				a = 100.0
# 				joint = np.random.dirichlet(np.ones(args[0]*args[1])*a,size=1).reshape((args[0],args[1]))
# 				if np.sum(joint) == 1.0:
# 					break
# 			self.joint = np.array(joint)
# 		else:
# 			self.joint = np.array(args[0])

# 		#format
# 		sort_index_m = np.argsort(np.sum(self.joint, axis=1))[::-1]
# 		sort_index_p = np.argsort(np.sum(self.joint, axis=0))[::-1]
		
# 		self.joint = self.joint[sort_index_m]
# 		self.joint = np.array([row[sort_index_p] for row in self.joint])

# 		self.prior = np.sum(self.joint, axis=0)
# 		self.marginal = np.sum(self.joint, axis=1)
# 		likelihood = []
# 		for i in np.arange(len(self.prior)):
# 			likelihood.append(self.joint[0][i]/self.prior[i])
# 		self.likelihood = np.array(likelihood)
# 		posterior = []
# 		for i in np.arange(len(self.marginal)):
# 			posterior.append([self.joint[i][j]/self.marginal[i] 
# 				for j in np.arange(len(self.prior))])
# 		self.posterior = np.array(posterior)




def create_env_file(probs, change=0):

	env_object = []
	
	def get_env(probb, name, id=0):
		for i in np.arange(len(probb)):
			probb[i] = round(probb[i],2)
		jj = sim.joint_probs(probb[0], probb[1], probb[2])
		
		entry = {'envID': id, 
				'envName': name, 
				'prior': probb[0],
				'likelihood': [probb[1], probb[2]],
				'joint': jj
				}

		env_object.append(entry)
		return

	get_env([probs[0], probs[1], probs[2]], 'Baseline', 0)
	get_env([probs[3], probs[1], probs[2]], 'Prior-Change', 1)
	get_env([probs[0], probs[4], probs[5]], 'Likelihood-Change', 2)

	fileName = 'output/environment_%d.json' % change
	with open(fileName, 'w') as outfile:
		json.dump(env_object, outfile, indent=2, sort_keys=True)
	return




idds = ['prior', 'feature', 'likelihood1', 'likelihood2', 'posterior']
diseased = ["The patient more likely suffers from disease {{A}}.",
      "The patient more likely suffers from disease {{B}}.",
      "The chances that the patient suffers from A or B are the same."]

with open('../txt/questions.json') as data_file:    
    questions = json.load(data_file)

def nearest_rational(p, ceil=10):
	p /= 100
	tmp_array = []
	rst_array = []
	for i in np.arange(1,ceil):
		denom = i+1
		factor = 100/denom
		nom = int(p*100/factor)
		if nom==0: 
			continue
		else:
			rest = (p*100 % factor)
			tmp_array.append('%s/%s' % (nom,denom))
			rst_array.append(round(rest,2))

	return tmp_array[np.argmin(rst_array)]

def tr(n):
	return ("%d" % n)

def round_to_nearest(x, base):
	return int(base * round(float(x)/base))

def add_options(prob, set_level=10, percent=False, rational=False):
	answer = round_to_nearest(100*prob, 5)
	choices = []
	for i in np.arange(3):
		temp = answer + i * set_level
		if i > 0 and random.random() < 0.5:
			subt = int(random.random() * 2 + 1) * 10 - 15
			temp += subt
		if temp > 90 or temp < 10:
			temp = (temp+10) % 100
		
		if percent == True:
			choices.append(tr(temp)+'%')
		elif rational == True:
			choices.append(nearest_rational(temp))
		else:
			choices.append(tr(temp))
	
	return answer, choices

def create_question_file(probs, change=0):
	#input environmental probabilities
	
	def q_for_env(prior, lik1, lik2, env=0):

		#compute a few things

		question_object = []
		for i in np.arange(len(questions)):
			if i == 0:
				#compute largest prior
				correct = 0 if prior > 0.5 else 1
				if prior == 0.5: correct = 2
				choices = diseased
			elif i == 1:
				#compute feature probabilities
				f1 = prior * lik1
				f2 = (1-prior) * lik2
				correct = 0
				answer, choices = add_options(f1 + f2, set_level=30)
			elif i == 2:
				correct = 0
				answer, choices = add_options(lik1, set_level=30, rational=True)
			elif i == 3:
				correct = 0
				answer, choices = add_options(lik2, set_level=30, rational=True)
			elif i == 4:
				f1 = prior * lik1
				f2 = (1-prior) * lik2
				posterior = f1/(f1+f2)
				correct = 0 if posterior > 0.5 else 1
				if posterior == 0.5: correct = 2
				choices = diseased
			else:
				print "should not appear!!"

			entry = {'id': idds[i], 
					'name': questions[i], 
					'choices': choices,
					'correct': str(correct)}
			question_object.append(entry)

		#write JSON file
		fileName = 'output/questions_%d_%d.json' % (change, env)
		with open(fileName, 'w') as outfile:
		    json.dump(question_object, outfile, indent=2)
		    # print 'write file'

	p, l1, l2, p_new, l1_new, l2_new = probs
	q_for_env(p, l1, l2, env=0)
	q_for_env(p_new, l1, l2, env=1)
	q_for_env(p, l1_new, l2_new, env=2)
