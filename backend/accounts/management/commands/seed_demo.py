"""
Load realistic Kathmandu demo data for CivicVoice.

Usage:
  python manage.py seed_demo
  python manage.py seed_demo --force   # wipe previous demo rows and reseed
"""

from datetime import timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from accounts.models import User
from comments.models import Comment
from notices.models import Notice
from reports.models import Report
from upvotes.models import Upvote

DEMO_DOMAIN = "demo.civicvoice.app"
DEMO_PASSWORD = "Demo@12345"
MUNI = "Kathmandu"


class Command(BaseCommand):
    help = "Seed ~30 realistic Kathmandu demo reports plus users, comments, upvotes, and notices."

    def add_arguments(self, parser):
        parser.add_argument(
            "--force",
            action="store_true",
            help="Delete existing demo users/data and recreate.",
        )

    def handle(self, *args, **options):
        existing = User.objects.filter(email__endswith=f"@{DEMO_DOMAIN}")
        if existing.exists() and not options["force"]:
            self.stdout.write(
                self.style.WARNING(
                    f"Demo data already present ({existing.count()} users). "
                    "Use --force to recreate."
                )
            )
            return

        with transaction.atomic():
            if options["force"] and existing.exists():
                count = existing.count()
                existing.delete()
                self.stdout.write(f"Removed {count} existing demo users (cascaded).")

            officials = self._create_officials()
            citizens = self._create_citizens()
            reports = self._create_reports(citizens)
            self._create_comments(reports, citizens, officials)
            self._create_upvotes(reports, citizens, officials)
            self._create_notices(officials)
            self._apply_progress(reports, officials)

        self.stdout.write(self.style.SUCCESS(
            f"Seeded demo data: {len(officials)} officials, {len(citizens)} citizens, "
            f"{len(reports)} reports, comments, upvotes, notices.\n"
            f"Login any demo user with password: {DEMO_PASSWORD}\n"
            f"Examples: ramesh.thapa@{DEMO_DOMAIN} | ward3.official@{DEMO_DOMAIN}"
        ))

    def _create_officials(self):
        data = [
            ("ward3.official", "Hari Prasad Adhikari", "9801110003", 3, "Ward 3 officer — New Baneshwor"),
            ("ward5.official", "Sita Devi Shrestha", "9801110005", 5, "Ward 5 officer — Thamel / Paknajol"),
            ("ward10.official", "Bikram Bahadur KC", "9801110010", 10, "Ward 10 officer — Baneshwor"),
            ("kmc.admin", "Municipal Coordinator", "9801110099", 1, "Kathmandu Metro coordination desk"),
        ]
        users = []
        for username, name, phone, ward, bio in data:
            users.append(
                User.objects.create_user(
                    email=f"{username}@{DEMO_DOMAIN}",
                    password=DEMO_PASSWORD,
                    username=username,
                    full_name=name,
                    phone_number=phone,
                    municipality=MUNI,
                    ward_number=ward,
                    role=User.Role.OFFICIAL,
                    is_verified=True,
                    bio=bio,
                    reputation_points=120,
                )
            )
        return users

    def _create_citizens(self):
        data = [
            ("ramesh.thapa", "Ramesh Thapa", "9841001001", 3, "Neighbourhood volunteer in Baneshwor"),
            ("sunita.rai", "Sunita Rai", "9841001002", 2, "Ratna Park area resident"),
            ("bikash.gurung", "Bikash Gurung", "9841001003", 8, "Koteshwor market trader"),
            ("priya.sharma", "Priya Sharma", "9841001004", 10, "Gyaneswor resident"),
            ("anita.lama", "Anita Lama", "9841001005", 15, "Patan-border ward neighbour"),
            ("deepak.maharjan", "Deepak Maharjan", "9841001006", 5, "Thamel shop owner"),
            ("kabita.basnet", "Kabita Basnet", "9841001007", 16, "Kalimati household"),
            ("nischal.karki", "Nischal Karki", "9841001008", 4, "Bagbazar student"),
            ("manisha.pokharel", "Manisha Pokharel", "9841001009", 7, "Balaju apartment resident"),
            ("sagar.tamang", "Sagar Tamang", "9841001010", 6, "Chabahil daily commuter"),
            ("reena.gautam", "Reena Gautam", "9841001011", 11, "Sinamangal flat owner"),
            ("prakash.adhikari", "Prakash Adhikari", "9841001012", 14, "Kapan hillside resident"),
        ]
        users = []
        for username, name, phone, ward, bio in data:
            users.append(
                User.objects.create_user(
                    email=f"{username}@{DEMO_DOMAIN}",
                    password=DEMO_PASSWORD,
                    username=username,
                    full_name=name,
                    phone_number=phone,
                    municipality=MUNI,
                    ward_number=ward,
                    role=User.Role.CITIZEN,
                    is_verified=True,
                    bio=bio,
                    reputation_points=20 + ward * 3,
                )
            )
        return users

    def _create_reports(self, citizens):
        # (citizen_idx, title, description, category, lat, lng, ward, address, status, ai_status, progress)
        specs = [
            (0, "Large pothole near New Baneshwor Chowk",
             "A deep pothole has formed at the New Baneshwor Chowk intersection. Motorbikes swerve into oncoming traffic to avoid it. Needs urgent asphalt patch before monsoon worsens it.",
             "roads", "27.691500", "85.342800", 3, "New Baneshwor Chowk, Kathmandu", "open", "approved", ""),
            (1, "Overflowing bins along Ratna Park sidewalk",
             "Public bins near the Ratna Park south gate have been overflowing for four days. Plastic and food waste is spilling onto the footpath and attracting stray dogs.",
             "garbage", "27.706200", "85.315400", 2, "Ratna Park south gate", "in_review", "approved",
             "Ward sanitation team scheduled a special pickup for tomorrow morning."),
            (2, "Main water pipe leak near Koteshwor market",
             "Continuous leak from a distribution pipe beside Koteshwor market. Road surface is flooded and nearby shops are using buckets. Pressure has dropped for ~150 households.",
             "water", "27.678900", "85.349600", 8, "Koteshwor market lane", "open", "approved", ""),
            (3, "Street lights dark on Baneshwor–Gyaneswor stretch",
             "About a dozen poles between Baneshwor bridge and Gyaneswor junction have been dark for three weeks. Pedestrians feel unsafe after 8pm.",
             "street_lights", "27.696800", "85.336200", 10, "Baneshwor main road", "in_review", "approved",
             "NEA / ward electrician inspected poles; two fixtures ordered."),
            (4, "Clogged roadside drain outside Shree Mangal School",
             "Drain grate is broken and clogged with silt. During rain, water floods the school gate footpath. Children walk through dirty water every morning.",
             "sewage", "27.678400", "85.324100", 5, "Near Shree Mangal School", "open", "approved", ""),
            (5, "Illegal dumping behind Thamel Paknajol lane",
             "Construction debris and household trash dumped behind a Paknajol guest-house lane. Smell is strong and mosquitoes are breeding in stagnant puddles.",
             "garbage", "27.715600", "85.310800", 5, "Paknajol back lane, Thamel", "resolved", "approved",
             "Cleared by ward crew on 8 July. Warning notice issued to nearby lodge."),
            (6, "Low water pressure in Kalimati housing block",
             "Third and fourth floor flats in Kalimati have almost no water between 6–9am. Residents suspect a partially closed valve after recent line works.",
             "water", "27.698700", "85.299400", 16, "Kalimati vegetable market area", "open", "pending", ""),
            (7, "Broken railing on Bagbazar footbridge stairs",
             "Metal handrail on the east stairs of Bagbazar footbridge is loose. Elderly users grab it for support — risk of falling onto the roadway.",
             "roads", "27.706800", "85.319900", 4, "Bagbazar footbridge east stairs", "in_review", "approved",
             "Temporary caution tape installed. Welding team booked for this week."),
            (8, "Open manhole without cover near Balaju bypass",
             "Manhole cover missing beside Balaju industrial area footpath. At night it is nearly invisible. Urgent safety hazard.",
             "sewage", "27.733100", "85.303500", 7, "Balaju bypass footpath", "open", "approved", ""),
            (9, "Transformer humming loudly through the night",
             "NEA transformer near Chabahil chowk produces a loud hum after 10pm. Several households report sleep disturbance for over a month.",
             "electricity", "27.717400", "85.346800", 6, "Chabahil chowk", "open", "flagged", ""),
            (10, "Flooded underpass after every rainfall",
             "Sinamangal underpass fills with knee-deep water within 20 minutes of rain. Drainage pumps appear offline. Commuters are stranded daily.",
             "water", "27.695200", "85.356100", 11, "Sinamangal underpass", "in_review", "approved",
             "Pump contractor contacted; temporary diversion signs placed."),
            (11, "Uncollected garbage along Kapan hillside road",
             "Door-to-door collection skipped this hillside stretch for two weeks. Bags are torn open by dogs. Residents requesting schedule reinstatement.",
             "garbage", "27.739800", "85.360200", 14, "Kapan hillside road", "open", "approved", ""),
            (0, "Zebra crossing paint faded at Baneshwor intersection",
             "Pedestrian crossing marks at Baneshwor traffic light are almost invisible. Drivers do not yield. Schoolchildren cross here every afternoon.",
             "roads", "27.692800", "85.341100", 3, "Baneshwor traffic light", "resolved", "approved",
             "Repainted by traffic engineering unit on 5 July."),
            (1, "Broken park bench and litter at Ratna Park",
             "Two wooden benches near the fountain are collapsed. Nearby litter bins are missing lids. Park feels neglected despite heavy footfall.",
             "parks", "27.707100", "85.316200", 2, "Ratna Park fountain area", "open", "approved", ""),
            (2, "Sewage overflow into Koteshwor alley",
             "Black wastewater seeping from a cracked sewer line into a residential alley. Strong odour; families keeping windows closed.",
             "sewage", "27.677500", "85.351200", 8, "Residential alley, Koteshwor", "in_review", "approved",
             "KUKL team surveyed the line; excavation planned next Monday."),
            (3, "Flickering street light outside community school",
             "Single pole outside the community school flickers all night. Children walking home after tuition find the stretch poorly lit.",
             "street_lights", "27.697900", "85.334800", 10, "Community school gate, Gyaneswor", "open", "pending", ""),
            (5, "Nightlife noise after 11pm on Thamel street",
             "Multiple bars on a Thamel lane play music past midnight despite residential flats above. Sleep disruption for families and tourists.",
             "noise", "27.714800", "85.311500", 5, "Thamel tourist street", "open", "approved", ""),
            (6, "Electric pole leaning toward house wall",
             "Wooden utility pole leaning ~20 degrees toward a Kalimati house. Residents fear it may fall in strong wind. Reported to NEA twice with no visit.",
             "electricity", "27.699500", "85.300800", 16, "Kalimati residential lane", "in_review", "approved",
             "NEA safety team scheduled inspection within 48 hours."),
            (7, "Sidewalk tiles missing near Padmodaya School",
             "A 15-metre stretch of sidewalk tiles is missing. Students walk on uneven mud, especially hazardous in rain.",
             "roads", "27.705900", "85.321400", 4, "Padmodaya School approach", "open", "approved", ""),
            (8, "Park lights out in Balaju recreation ground",
             "All four floodlights in the small Balaju recreation ground have been dead for a month. Evening walkers feel unsafe.",
             "parks", "27.731800", "85.304900", 7, "Balaju recreation ground", "resolved", "approved",
             "Bulbs replaced and timer reset by ward electrician."),
            (9, "Water tanker filling illegally from public tap",
             "Private tanker operators fill from a public standpost near Chabahil every morning, leaving low pressure for nearby homes.",
             "water", "27.716600", "85.348100", 6, "Public standpost, Chabahil", "open", "approved", ""),
            (10, "Exposed electrical wires after road dig",
             "Road excavation for fibre cable left live wires exposed beside Sinamangal footpath. Temporary tape already torn away.",
             "electricity", "27.694400", "85.354800", 11, "Sinamangal dig site", "open", "flagged", ""),
            (11, "Landslide debris blocking hillside footpath",
             "Recent rain loosened soil onto the only footpath connecting hillside homes to the main Kapan road. Elders cannot pass safely.",
             "other", "27.741200", "85.361500", 14, "Kapan hillside footpath", "in_review", "approved",
             "Ward coordinating with disaster management for debris clearance."),
            (0, "Bus stop shelter roof collapsed",
             "Corrugated roof of the Baneshwor eastbound bus shelter collapsed after last week's wind. Commuters wait in open sun/rain.",
             "other", "27.690900", "85.343500", 3, "Baneshwor eastbound bus stop", "open", "approved", ""),
            (4, "Stray dog packs near school dismissal time",
             "Aggressive stray dogs gather near the school gate at 3:30pm. Parents requesting animal control and temporary fencing.",
             "other", "27.679100", "85.325000", 5, "School gate approach", "open", "pending", ""),
            (1, "Public toilet locked during park hours",
             "Ratna Park public toilet remains locked most afternoons despite posted opening hours. Visitors have nowhere nearby to go.",
             "parks", "27.706500", "85.314800", 2, "Ratna Park toilet block", "rejected", "approved",
             "Facility under renovation; temporary portable units requested — rejected pending budget."),
            (2, "Market waste dumped into storm drain",
             "Vegetable vendors dump spoiled produce into the storm drain after closing. Drain backs up onto Koteshwor road within hours.",
             "garbage", "27.679600", "85.350100", 8, "Koteshwor market drain inlet", "open", "approved", ""),
            (3, "Speed breakers unmarked on school road",
             "New concrete speed breakers installed without paint or signs. Motorbikes hit them hard at night — two near-accidents reported.",
             "roads", "27.695500", "85.337000", 10, "School access road, Baneshwor", "in_review", "approved",
             "Traffic paint scheduled; temporary reflective stickers applied."),
            (7, "Construction dust without site netting",
             "Mid-rise construction site on Bagbazar road has no dust nets. Fine dust coats neighbouring shops and causes coughing among street vendors.",
             "noise", "27.707400", "85.320500", 4, "Bagbazar construction site", "open", "approved", ""),
            (8, "Broken fire hydrant leaking for a week",
             "Hydrant near Balaju industrial road is leaking continuously. Water pools on the carriageway and freezes traffic during peak hours.",
             "water", "27.732400", "85.302800", 7, "Balaju industrial road", "resolved", "approved",
             "Hydrant valve closed and gasket replaced by KUKL."),
        ]

        reports = []
        now = timezone.now()
        for i, spec in enumerate(specs):
            (
                c_idx, title, desc, category, lat, lng, ward, address,
                status, ai_status, progress,
            ) = spec
            report = Report.objects.create(
                citizen=citizens[c_idx % len(citizens)],
                title=title,
                description=desc,
                category=category,
                latitude=Decimal(lat),
                longitude=Decimal(lng),
                municipality=MUNI,
                ward_number=ward,
                address=address,
                status=status,
                ai_status=ai_status,
                visibility=True,
                progress_notes=progress,
            )
            # Stagger created_at for a natural feed
            Report.objects.filter(pk=report.pk).update(
                created_at=now - timedelta(days=(len(specs) - i), hours=i % 5)
            )
            report.refresh_from_db()
            reports.append(report)
        return reports

    def _create_comments(self, reports, citizens, officials):
        samples = [
            (0, 1, None, "I pass this chowk every morning — it's getting worse after the rains."),
            (0, 5, None, "Ward office should prioritise this before someone crashes."),
            (0, 0, 0, "I uploaded clearer photos yesterday in case it helps."),
            (1, 0, None, "Same issue near the north gate. Please expand the cleanup."),
            (2, 3, None, "Our tank ran dry yesterday. Any temporary tanker schedule?"),
            (2, 1, 0, "Official: tanker roster for wards 8–9 will be posted tonight."),
            (3, 4, None, "Shopkeepers are hanging bulbs on their own — not a real fix."),
            (4, 6, None, "My kid slipped here last week. Please fix the grate ASAP."),
            (5, 2, None, "Great to see this cleared. Hoping it stays clean."),
            (7, 8, None, "Saw the caution tape — thanks for acting quickly."),
            (8, 9, None, "This is extremely dangerous at night. Please cover tonight."),
            (10, 10, None, "Underpass was impassable again after yesterday's shower."),
            (11, 11, None, "Collection truck skipped us again today."),
            (13, 1, None, "Benches have been broken for months. Park deserves better."),
            (16, 5, None, "Noise continues past 1am on weekends. Please enforce rules."),
            (17, 6, None, "The pole leans more after last night's wind."),
            (19, 8, None, "Lights are back — evening walks feel safer. Thank you!"),
            (21, 10, None, "Kids walk past those exposed wires to school. Urgent."),
            (23, 0, None, "Bus shelter was useful for elderly passengers. Please rebuild."),
            (27, 3, None, "Reflective stickers help a bit, but proper paint is needed."),
        ]
        for r_idx, u_idx, parent_idx, content in samples:
            report = reports[r_idx]
            # Official comments use officials[0] when u_idx marked specially via content
            if content.startswith("Official:"):
                user = officials[0]
                content = content.replace("Official: ", "", 1)
            else:
                user = citizens[u_idx % len(citizens)]
            parent = None
            if parent_idx is not None:
                # parent_idx here means "reply to first comment on this report"
                parent = Comment.objects.filter(report=report, parent=None).first()
            Comment.objects.create(report=report, user=user, parent=parent, content=content)

    def _create_upvotes(self, reports, citizens, officials):
        pairs = set()
        # denser upvotes on earlier / higher-visibility issues
        for r_idx, report in enumerate(reports):
            voters = list(citizens) + list(officials[:2])
            # rotate who upvotes
            for offset in range(3 + (r_idx % 5)):
                user = voters[(r_idx + offset * 3) % len(voters)]
                key = (report.id, user.id)
                if user.id == report.citizen_id or key in pairs:
                    continue
                pairs.add(key)
                Upvote.objects.get_or_create(report=report, user=user)

    def _create_notices(self, officials):
        now = timezone.now()
        notices = [
            (0, "Monsoon drain cleaning drive — Wards 3 & 10",
             "Kathmandu Metropolitan City will conduct pre-monsoon drain cleaning on 14–16 July across Wards 3 and 10. Please keep drain inlets clear of household waste. Vehicles parked over manholes may be temporarily towed.",
             3, True, True, 20),
            (1, "Street light complaint desk hours extended",
             "Ward 5 office street-light desk will remain open until 6pm on weekdays through July. Bring the pole number if available. Emergency dark stretches can also be reported via CivicVoice.",
             5, True, False, 30),
            (2, "Water supply interruption notice — Baneshwor",
             "KUKL informs that water supply to parts of Baneshwor (Ward 10) will be interrupted on Saturday 9am–3pm for distribution line repair. Please store water in advance.",
             10, True, True, 10),
            (3, "Anti-litter campaign at Ratna Park",
             "Volunteer clean-up at Ratna Park this Sunday 7–9am. Gloves and bags provided. All citizens welcome. Coordinated by the municipal environment desk.",
             None, True, False, 15),
            (0, "Report status updates now visible publicly",
             "CivicVoice now shows ward progress notes on every public report. Officials are requested to post short updates when work is assigned or completed.",
             None, True, False, 5),
            (1, "Dog vaccination camp — Balaju area",
             "Free anti-rabies vaccination for pet and community dogs at Balaju recreation ground on 20 July, 10am–2pm. Bring a leash. Organised with the livestock services office.",
             7, True, False, 25),
            (2, "Road resurfacing schedule — Koteshwor corridor",
             "Partial resurfacing along the Koteshwor market corridor is planned for the last week of July, weather permitting. Expect daytime diversions; night work may occur.",
             8, True, False, 12),
            (3, "Draft ward budget consultation open",
             "Draft ward-level priority list for small infrastructure is open for citizen comments until 25 July. Use CivicVoice reports and the ward office suggestion box.",
             None, True, True, 8),
        ]
        for off_idx, title, content, ward, published, pinned, days_expire in notices:
            Notice.objects.create(
                title=title,
                content=content,
                municipality=MUNI,
                ward_number=ward,
                created_by=officials[off_idx % len(officials)],
                is_published=published,
                is_pinned=pinned,
                expires_at=now + timedelta(days=days_expire),
            )

    def _apply_progress(self, reports, officials):
        # Touch a couple open reports with progress notes to generate STATUS/PROGRESS notifs
        targets = [r for r in reports if r.status == "open" and not r.progress_notes][:3]
        for report in targets:
            Report.objects.filter(pk=report.pk).update(
                status="in_review",
                progress_notes=f"Assigned to {officials[0].full_name}'s ward desk for site visit.",
            )
