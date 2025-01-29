from django.urls import include, path
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'friends', views.FriendActionsViewSet, basename='friends')
router.register(r'friend-requests', views.FriendRequestViewSet, basename='friend_requests')

urlpatterns = [
    path('signup/', views.signup_view, name='signup'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('profile/', views.profile_view, name='profile'),
    path('update-profile/', views.update_profile_view, name='update_profile'),
    path('upload-avatar/', views.upload_avatar, name='upload_avatar'),
    path('', include(router.urls)),
	#path('game-history/', views.add_friend_view, name='game_history')
]
