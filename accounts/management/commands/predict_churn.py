# accounts/management/commands/predict_churn.py
"""
Management command — run churn predictions for all customers.

Usage:
    python manage.py predict_churn
    python manage.py predict_churn --customer-id 42
    python manage.py predict_churn --dry-run
"""

from django.core.management.base import BaseCommand
from django.utils import timezone


class Command(BaseCommand):
    help = 'Run churn predictions for customers and store results in the DB.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--customer-id',
            type=int,
            default=None,
            help='Run prediction for a single customer (by user ID).',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Print predictions without saving to the database.',
        )

    def handle(self, *args, **options):
        from accounts.models import Customer
        from accounts.ml_service import predict

        cid      = options['customer_id']
        dry_run  = options['dry_run']

        if cid:
            try:
                profiles = [Customer.objects.select_related('user').get(user_id=cid)]
            except Customer.DoesNotExist:
                self.stderr.write(self.style.ERROR(f'Customer with user_id={cid} not found.'))
                return
        else:
            profiles = list(
                Customer.objects.select_related('user').filter(user__user_type='customer')
            )

        self.stdout.write(f'Running predictions for {len(profiles)} customer(s)…')
        now = timezone.now()

        for profile in profiles:
            profile.update_all_metrics()
            result = predict(profile)
            name   = profile.user.get_full_name() or profile.user.username

            self.stdout.write(
                f'  {name:30s}  prob={result["churn_probability"]:5.1f}%  '
                f'predicted={"YES" if result["churn_predicted"] else "no "}  '
                f'conf={result["confidence"]:5.1f}% ({result["confidence_label"]})'
            )

            if not dry_run:
                Customer.objects.filter(pk=profile.pk).update(
                    churn_probability    = result['churn_probability'],
                    churn_predicted      = result['churn_predicted'],
                    last_prediction_date = now,
                )

        if dry_run:
            self.stdout.write(self.style.WARNING('Dry run — nothing saved.'))
        else:
            self.stdout.write(self.style.SUCCESS(f'Done. {len(profiles)} prediction(s) saved.'))