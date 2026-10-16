"""
Seed expanded lab + imaging catalog for ICD-10 driven ordering.
Usage: python manage.py seed_icd_lab_catalog
"""
from decimal import Decimal

from django.core.management.base import BaseCommand

from lab_management.icd_lab_knowledge import CATALOG_SEEDS
from lab_management.models import LabTest, TestCategory


class Command(BaseCommand):
    help = "Seed/expand LabTest catalog (labs + imaging) for ICD-10 recommendations"

    def handle(self, *args, **options):
        created = 0
        updated = 0
        for code, name, cat_name, desc, unit, normal, price, tat in CATALOG_SEEDS:
            cat, _ = TestCategory.objects.get_or_create(
                name=cat_name,
                defaults={"description": f"{cat_name} tests", "is_active": True},
            )
            if not cat.is_active:
                cat.is_active = True
                cat.save(update_fields=["is_active"])

            obj = LabTest.objects.filter(test_code__iexact=code).first()
            if obj:
                changed = False
                if not obj.is_active:
                    obj.is_active = True
                    changed = True
                if obj.category_id != cat.id:
                    obj.category = cat
                    changed = True
                if changed:
                    obj.save()
                    updated += 1
                continue

            LabTest.objects.create(
                test_code=code.upper(),
                test_name=name,
                category=cat,
                description=desc,
                normal_range=normal,
                unit=unit,
                price=Decimal(str(price)),
                preparation_instructions="",
                turnaround_time=int(tat or 1),
                is_active=True,
            )
            created += 1

        total = LabTest.objects.filter(is_active=True).count()
        imaging = LabTest.objects.filter(is_active=True, category__name__icontains="imag").count()
        self.stdout.write(
            self.style.SUCCESS(
                f"seed_icd_lab_catalog: created={created} updated={updated} active_total={total} imaging={imaging}"
            )
        )
