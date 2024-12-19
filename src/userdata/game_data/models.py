from django.db import models
from django.utils.timezone import now

class GameData(models.Model):
    # game modes are 'single-player' or 'multi-player'
    gameMode = models.CharField(max_length=15)
    player1 = models.CharField(max_length=50)
    player2 = models.CharField(max_length=50, default=None)
    gameFinished = models.BooleanField(default=True)
    # score for example '1-12' 
    score = models.CharField(max_length=20)
    finishTime = models.DateTimeField()
    
    def __str__(self):
        return (str(self.dateTime) + ':' + str(self.player1) + ' vs. ' 
                + str(self.player2) + ', score: ' + str(self.score))
