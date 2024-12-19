from rest_framework import serializers
from .models import GameData
from django.contrib.auth.models import User
from app.settings import GAME_MODES
import re

class GameDataSerializer(serializers.ModelSerializer):
	class Meta:
		model = GameData
		fields = '__all__'
	
	def validate_gameMode(self, value):
		valid_modes = GAME_MODES
		if value not in valid_modes:
			raise serializers.ValidationError("Invalid gameMode. Valid options are: " +", ".join(valid_modes))
		return value
	
	def validate_score(self, value):
		if not re.match(r'^\d+-\d+$', value):
			raise serializers.ValidationError(
				"Invalid score, must be in format 'number-number' (e.g., '1-12').")
		return value
	
	def validate(self, data):
		if not User.objects.filter(username=data['player1']):
			raise serializers.ValidationError({"player1": 
				f"Player {data['player1']} does not exist."})
		if data['gameMode'] == 'multi-player':
			if not User.objects.filter(username=data['player2']):
				raise serializers.ValidationError({"player2": 
					f"Player {data['player2']} does not exist."})
			if data['player1'] == data['player2']:
				raise serializers.ValidationError(
					"player1 and player2 cannot be the same.")
