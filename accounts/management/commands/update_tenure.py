# accounts/management/commands/update_tenure.py
from django.core.management.base import BaseCommand
from django.utils import timezone
from accounts.models import Customer

class Command(BaseCommand):
    help = 'Update tenure for all customers at the end of each month'

    def handle(self, *args, **options):
        self.stdout.write('Starting tenure update...')
        
        customers = Customer.objects.all()
        updated_count = 0
        
        for customer in customers:
            old_tenure = customer.tenure
            customer.update_tenure_auto()
            if customer.tenure != old_tenure:
                updated_count += 1
                self.stdout.write(f'Updated {customer.user.username}: {old_tenure} -> {customer.tenure} months')
        
        self.stdout.write(self.style.SUCCESS(f'Successfully updated tenure for {updated_count} customers'))