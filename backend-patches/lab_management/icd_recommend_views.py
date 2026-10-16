"""
GET /lab/icd-recommendations/?codes=I10,E11.9
Returns AI-assisted lab + radiology suggestions matched to live LabTest catalog.
"""
from __future__ import annotations

from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle

from lab_management.icd_lab_knowledge import recommend_for_codes
from lab_management.models import LabTest
from lab_management.serializers import LabTestSerializer


class SoftAnonThrottle(AnonRateThrottle):
    rate = "120/min"


@api_view(["GET"])
@permission_classes([AllowAny])
@throttle_classes([SoftAnonThrottle])
def icd_lab_recommendations(request):
    raw = request.query_params.get("codes") or request.query_params.get("code") or ""
    codes = [c.strip() for c in raw.replace(";", ",").split(",") if c.strip()]
    if not codes:
        return Response(
            {
                "status": "error",
                "message": "Pass ?codes=I10,E11.9",
                "data": None,
            },
            status=400,
        )

    plan = recommend_for_codes(codes)
    wanted = set(plan["recommended_lab_codes"]) | set(plan["recommended_imaging_codes"])
    qs = LabTest.objects.filter(is_active=True, test_code__in=wanted).select_related("category")
    by_code = {t.test_code.upper(): t for t in qs}

    def hydrate(codes_list):
        out = []
        for code in codes_list:
            t = by_code.get(code.upper())
            if t:
                out.append(LabTestSerializer(t).data)
            else:
                out.append(
                    {
                        "id": None,
                        "test_code": code,
                        "test_name": code,
                        "category_name": "Unavailable in catalog",
                        "is_active": False,
                        "missing_in_catalog": True,
                    }
                )
        return out

    labs = hydrate(plan["recommended_lab_codes"])
    imaging = hydrate(plan["recommended_imaging_codes"])

    return Response(
        {
            "status": "success",
            "message": "ICD-10 lab/radiology recommendations",
            "data": {
                **plan,
                "labs": labs,
                "imaging": imaging,
                "catalog_matched": sum(1 for x in labs + imaging if not x.get("missing_in_catalog")),
                "ai_enhanced": True,
                "online_resources": [
                    "https://www.cms.gov/medicare/coverage/determination-process/basics/lab-ncds-icd-10",
                    "https://clinicaltables.nlm.nih.gov/apidoc/icd10cm/v3/doc.html",
                    "https://www.acr.org/Clinical-Resources/ACR-Appropriateness-Criteria",
                ],
            },
        }
    )
