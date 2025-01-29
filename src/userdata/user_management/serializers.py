from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Profile
from .models import FriendRequest
from django.db import models
from datetime import timedelta
from django.utils.timezone import now

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    stats = serializers.JSONField(read_only=True)
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = ['user', 'display_name', 'avatar_url', 'stats']


    def get_avatar_url(self, obj):
        """Return the avatar URL or a default if not set."""
        if obj.avatar:
            return obj.avatar.url
        return f"{settings.STATIC_URL}images/default-avatar.jpeg"


    def update(self, instance, validated_data):
        instance.display_name = validated_data.get('display_name', instance.display_name)

        avatar = validated_data.get('avatar')
        if avatar:
            instance.avatar.save(avatar.name, avatar)

        password = validated_data.pop('password', None)
        if password:
            instance.user.set_password(password)
            instance.user.save()
        instance.save()
        return instance

class FriendSerializer(serializers.ModelSerializer):
    username = serializers.SerializerMethodField()
    is_friend = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = ['id', 'username', 'is_friend']

    def get_username(self, obj):
        """Ensure we always get the correct username whether obj is Profile or User."""
        if isinstance(obj, User):
            return obj.username
        return obj.user.username

    def get_is_friend(self, obj):
        request = self.context.get('request', None)
        if request and request.user.is_authenticated:
            return obj in request.user.profile.friends.all()
        return False


class FriendRequestSerializer(serializers.ModelSerializer):
    from_user = serializers.CharField(source='from_user.username')
    to_user = serializers.CharField(source='to_user.username')

    class Meta:
        model = FriendRequest
        fields = ['id', 'from_user', 'to_user', 'created_at', 'is_accepted', 'is_rejected']
