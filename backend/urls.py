# backend/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),
    
    # Authentication (accounts app)
    path('api/auth/', include('accounts.urls')),
    
    # Medicines app
    path('api/medicines/', include('medicines.urls')),
    
    # Orders app
    path('api/', include('orders.urls')),
    
    # Notifications app
    path('api/notifications/', include('notifications.urls')),
]

# Add media URL serving in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)