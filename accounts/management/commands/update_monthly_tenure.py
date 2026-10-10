# accounts/management/commands/update_monthly_tenure.py
#
# Run this command once a month via cron / Windows Task Scheduler:
#
#   Linux/Mac crontab (1st of every month at 00:05):
#     5 0 1 * * /path/to/venv/bin/python /path/to/manage.py update_monthly_tenure
#
#   Windows Task Scheduler:
#     Program : python
#     Arguments: D:\churn-prediction-system\manage.py update_monthly_tenure
#     Trigger  : Monthly, day 1, 00:05
#
# You can also run it manually any time:
#     python manage.py update_monthly_tenure

from django.core.management.base import BaseCommand
from django.utils import timezone
from accounts.models import Customer


class Command(BaseCommand):
    help = 'Recalculate tenure for every customer and update all metrics.'

    def handle(self, *args, **options):
        customers = Customer.objects.select_related('user').all()
        total     = customers.count()
        updated   = 0
        errors    = 0

        self.stdout.write(
            f'[{timezone.now():%Y-%m-%d %H:%M}] '
            f'Starting monthly tenure update for {total} customers...'
        )

        for customer in customers:
            try:
                old_tenure = customer.tenure
                customer.update_all_metrics()   # tenure first, then usage/complaints/sat
                new_tenure = customer.tenure

                self.stdout.write(
                    f'  ✓ {customer.user.get_full_name():<30} '
                    f'tenure: {old_tenure} → {new_tenure} months'
                )
                updated += 1
            except Exception as e:
                self.stderr.write(
                    f'  ✗ Customer {customer.id} ({customer.user.get_full_name()}): {e}'
                )
                errors += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'\nDone. Updated: {updated}  |  Errors: {errors}  |  '
                f'Total: {total}'
            )
        )
