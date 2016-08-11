import simulations as sim
import generateQuestions as gen

def createIMGandQuestions(probs, changeType=0):
	gen.create_question_file(probs, change=changeType)
	gen.create_env_file(probs, change=changeType)
	return

probs_low 		= sim.get_best_env(0, Ctype=0)
probs_medium 	= sim.get_best_env(0, Ctype=1)
probs_high 		= sim.get_best_env(0, Ctype=2)

createIMGandQuestions(probs_low, 	changeType=0)
createIMGandQuestions(probs_medium, changeType=1)
createIMGandQuestions(probs_high, 	changeType=2)
# plt.show()