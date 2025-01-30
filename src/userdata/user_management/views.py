import logging
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.utils.crypto import get_random_string
from django.shortcuts import render, redirect
from django.db import IntegrityError
from rest_framework import status
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.http import HttpResponse
from .models import Profile, FriendRequest
from .serializers import UserSerializer, ProfileSerializer, FriendSerializer, FriendRequestSerializer
from django.middleware.csrf import get_token
from rest_framework.decorators import api_view, parser_classes
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser


logger = logging.getLogger('django')

@api_view(['POST'])
def signup_view(request):
    logger.info("Signup request received.")
    username = request.data.get('username')
    password = request.data.get('password')
    email = request.data.get('email')

    if not username or not password or not email:
        logger.error("Invalid signup data.")
        return Response({"error": "Invalid data"}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(username=username).exists():
        logger.error(f"Username already exists: {username}")
        return Response({"error": "Username already exists"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.create_user(username=username, password=password, email=email)
        logger.info(f"User created: {username} (ID: {user.id})")
        return Response({"message": "User created successfully"}, status=status.HTTP_201_CREATED)
    except IntegrityError as e:
        logger.error(f"IntegrityError during signup: {e}")
        return Response({"error": "An error occurred during signup."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(request, username=username, password=password)

    if user is not None:
        login(request, user)
        return Response({"message": "Login successful"}, status=status.HTTP_200_OK)

    return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['POST'])
def logout_view(request):
    logout(request)
    return Response({"message": "Logged out successfully"}, status=status.HTTP_200_OK)

@api_view(['GET'])
def profile_view(request):
    if not request.user.is_authenticated:
        return Response({"error": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        profile = get_object_or_404(Profile.objects.select_related('user'), user=request.user)
        serializer = ProfileSerializer(profile)
        data = serializer.data
        data['csrf_token'] = get_token(request)
        return Response(data, status=status.HTTP_200_OK)
    except Profile.DoesNotExist:
        return Response({"error": "Profile not found"}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@login_required
@parser_classes([MultiPartParser, FormParser])
def update_profile_view(request):
    profile = get_object_or_404(Profile, user=request.user)
    serializer = ProfileSerializer(profile, data=request.data, partial=True)
    if serializer.is_valid():
        user = profile.user
        email = request.data.get('email')
        if email:
            user.email = email
            user.save()

        serializer.save()
        return Response({"message": "Profile updated successfully"}, status=status.HTTP_200_OK)
    else:
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@login_required
@parser_classes([MultiPartParser, FormParser])
def upload_avatar(request):
    profile = get_object_or_404(Profile, user=request.user)
    file = request.FILES.get('avatar')
    if file:
        profile.avatar.save(file.name, file, save=True)
        return Response({'message': 'Avatar updated successfully'}, status=status.HTTP_200_OK)
    return Response({'error': 'No avatar provided'}, status=status.HTTP_400_BAD_REQUEST)

class FriendActionsViewSet(viewsets.ViewSet):
    """Manage friend operations (list, add, remove)."""
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'], url_path='list')
    def fetch_friends(self, request):
        try:
            profile = get_object_or_404(Profile.objects.prefetch_related('friends'), user=request.user)
            serialized_friends = FriendSerializer(profile.friends.all(), many=True, context={'request': request})
            return Response(serialized_friends.data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error fetching friends: {e}")  # 🔍 Log the error
            return Response({'error': 'Failed to load friends.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    @action(detail=False, methods=['post'], url_path='add/(?P<username>[^/.]+)')
    def send_friend_invite(self, request, username=None):
        """Add a friend directly."""
        if username == request.user.username:
            return Response({'status': 'error', 'message': 'Cannot add yourself.'}, status=status.HTTP_400_BAD_REQUEST)

        friend_user = get_object_or_404(User, username=username)
        profile = get_object_or_404(Profile, user=request.user)

        if friend_user.profile in profile.friends.all():
            return Response({'status': 'error', 'message': 'Already friends.'}, status=status.HTTP_400_BAD_REQUEST)

        profile.friends.add(friend_user.profile)
        return Response({'status': 'success', 'friend': FriendSerializer(friend_user.profile).data}, status=status.HTTP_201_CREATED)


    @action(detail=False, methods=['delete'], url_path='remove/(?P<username>[^/.]+)')
    def remove_friendship(self, request, username=None):
        """Remove a friend."""
        friend_user = get_object_or_404(User, username=username)
        profile = get_object_or_404(Profile, user=request.user)

        if friend_user.profile not in profile.friends.all():
            return Response({'status': 'error', 'message': 'Not in friend list.'}, status=status.HTTP_400_BAD_REQUEST)

        profile.friends.remove(friend_user.profile)
        return Response({'status': 'success', 'message': f'{username} removed.'}, status=status.HTTP_200_OK)
    @action(detail=False, methods=['post'], url_path='block/(?P<username>[^/.]+)')

    def block_user(self, request, username=None):
        if username == request.user.username:
            return Response({'status': 'error', 'message': 'You cannot block yourself.'}, status=status.HTTP_400_BAD_REQUEST)

        blocked_user = get_object_or_404(User, username=username)
        profile = get_object_or_404(Profile, user=request.user)

        if blocked_user.profile in profile.friends.all():
            profile.friends.remove(blocked_user.profile)

        profile.blocked_users.add(blocked_user.profile)

        return Response({'status': 'success', 'message': f'{username} has been blocked.'}, status=status.HTTP_200_OK)

class FriendRequestViewSet(viewsets.ViewSet):
    """ViewSet for managing friend requests (send, accept, decline)."""
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'], url_path='pending')
    def get_pending_requests(self, request):
        """Retrieve pending friend requests."""
        pending_requests = FriendRequest.objects.filter(
            to_user=request.user, is_accepted=False, is_rejected=False
        ).select_related('from_user')

        serialized_requests = FriendRequestSerializer(pending_requests, many=True)
        return Response({'status': 'success', 'pending_requests': serialized_requests.data})

    @action(detail=False, methods=['post'], url_path='request/(?P<username>[^/.]+)')
    def send_request(self, request, username=None):
        """Send a friend request."""
        if username == request.user.username:
            return Response(
                {'status': 'error', 'message': 'You cannot send a request to yourself.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        recipient = get_object_or_404(User, username=username)

        if FriendRequest.objects.filter(
            models.Q(from_user=request.user, to_user=recipient) |
            models.Q(from_user=recipient, to_user=request.user)
        ).exists():
            return Response(
                {'status': 'error', 'message': 'Friend request already exists.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if recipient.profile in request.user.profile.friends.all():
            return Response(
                {'status': 'error', 'message': 'You are already friends with this user.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        friend_request = FriendRequest.objects.create(from_user=request.user, to_user=recipient)
        return Response(
            {'status': 'success', 'request_id': friend_request.id},
            status=status.HTTP_201_CREATED
        )

    @action(detail=False, methods=['post'], url_path='accept/(?P<request_id>\d+)')
    def accept_request(self, request, request_id=None):
        """Accept a friend request."""
        friend_request = get_object_or_404(FriendRequest, id=request_id, to_user=request.user)

        sender_profile = friend_request.from_user.profile
        receiver_profile = request.user.profile

        sender_profile.friends.add(receiver_profile)
        receiver_profile.friends.add(sender_profile)

        friend_request.delete()

        return Response(
            {'status': 'success', 'message': 'Friend request accepted.'},
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=['post'], url_path='decline/(?P<request_id>\d+)')
    def decline_request(self, request, request_id=None):
        """Decline a friend request."""
        friend_request = get_object_or_404(FriendRequest, id=request_id, to_user=request.user)

        friend_request.delete()

        return Response(
            {'status': 'success', 'message': 'Friend request declined.'},
            status=status.HTTP_200_OK
        )
