from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Iterable

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    ListFlowable,
    ListItem,
    KeepTogether,
)
from reportlab.platypus.tableofcontents import TableOfContents


ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUT = os.path.join(ROOT, "docs", "Τεκμηρίωση_Εργασίας_ΤΕΔ2026.pdf")


FONT_REGULAR = r"C:\Windows\Fonts\arial.ttf"
FONT_BOLD = r"C:\Windows\Fonts\arialbd.ttf"
FONT_ITALIC = r"C:\Windows\Fonts\ariali.ttf"


@dataclass
class Section:
    title: str
    body: list


class ReportDocTemplate(BaseDocTemplate):
    def __init__(self, filename: str, **kwargs):
        super().__init__(filename, **kwargs)
        frame = Frame(
            self.leftMargin,
            self.bottomMargin,
            self.width,
            self.height,
            id="normal",
        )
        self.addPageTemplates(
            [
                PageTemplate(id="main", frames=[frame], onPage=draw_page),
            ]
        )

    def afterFlowable(self, flowable):
        if isinstance(flowable, Paragraph):
            style_name = flowable.style.name
            text = flowable.getPlainText()
            if self.page <= 2 or not text[:1].isdigit():
                return
            if style_name == "Heading1":
                self.notify("TOCEntry", (0, text, self.page))
                self.canv.bookmarkPage(text)
                self.canv.addOutlineEntry(text, text, level=0, closed=False)
            elif style_name == "Heading2":
                self.notify("TOCEntry", (1, text, self.page))


def register_fonts() -> None:
    pdfmetrics.registerFont(TTFont("Arial", FONT_REGULAR))
    pdfmetrics.registerFont(TTFont("Arial-Bold", FONT_BOLD))
    pdfmetrics.registerFont(TTFont("Arial-Italic", FONT_ITALIC))


def build_styles():
    base = getSampleStyleSheet()
    styles = {
        "Title": ParagraphStyle(
            "Title",
            parent=base["Title"],
            fontName="Arial-Bold",
            fontSize=24,
            leading=30,
            textColor=colors.HexColor("#1F3A5F"),
            alignment=TA_CENTER,
            spaceAfter=14,
        ),
        "Subtitle": ParagraphStyle(
            "Subtitle",
            parent=base["Normal"],
            fontName="Arial",
            fontSize=13,
            leading=18,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#444444"),
            spaceAfter=10,
        ),
        "CoverMeta": ParagraphStyle(
            "CoverMeta",
            parent=base["Normal"],
            fontName="Arial",
            fontSize=11,
            leading=16,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#333333"),
            spaceAfter=4,
        ),
        "Heading1": ParagraphStyle(
            "Heading1",
            parent=base["Heading1"],
            fontName="Arial-Bold",
            fontSize=16,
            leading=22,
            textColor=colors.HexColor("#1F3A5F"),
            spaceBefore=14,
            spaceAfter=8,
            keepWithNext=True,
        ),
        "Heading2": ParagraphStyle(
            "Heading2",
            parent=base["Heading2"],
            fontName="Arial-Bold",
            fontSize=12.5,
            leading=17,
            textColor=colors.HexColor("#2E5C8A"),
            spaceBefore=10,
            spaceAfter=6,
            keepWithNext=True,
        ),
        "Body": ParagraphStyle(
            "Body",
            parent=base["BodyText"],
            fontName="Arial",
            fontSize=10.2,
            leading=15,
            alignment=TA_JUSTIFY,
            spaceAfter=6,
        ),
        "Small": ParagraphStyle(
            "Small",
            parent=base["BodyText"],
            fontName="Arial",
            fontSize=8.5,
            leading=11,
            textColor=colors.HexColor("#444444"),
        ),
        "Code": ParagraphStyle(
            "Code",
            parent=base["Code"],
            fontName="Arial",
            fontSize=8.3,
            leading=11,
            leftIndent=8,
            rightIndent=8,
            backColor=colors.HexColor("#F3F5F7"),
            borderColor=colors.HexColor("#D7DEE8"),
            borderWidth=0.5,
            borderPadding=6,
            spaceBefore=4,
            spaceAfter=8,
        ),
        "Callout": ParagraphStyle(
            "Callout",
            parent=base["BodyText"],
            fontName="Arial",
            fontSize=9.5,
            leading=13,
            backColor=colors.HexColor("#EEF4FA"),
            borderColor=colors.HexColor("#C9D8E8"),
            borderWidth=0.6,
            borderPadding=7,
            leftIndent=0,
            rightIndent=0,
            spaceBefore=6,
            spaceAfter=8,
        ),
        "TOCHeading": ParagraphStyle(
            "TOCHeading",
            parent=base["Heading1"],
            fontName="Arial-Bold",
            fontSize=18,
            leading=24,
            textColor=colors.HexColor("#1F3A5F"),
            spaceAfter=12,
        ),
    }
    return styles


def draw_page(canvas, doc):
    canvas.saveState()
    width, height = A4
    if doc.page > 1:
        canvas.setStrokeColor(colors.HexColor("#D7DEE8"))
        canvas.setLineWidth(0.6)
        canvas.line(doc.leftMargin, height - 1.45 * cm, width - doc.rightMargin, height - 1.45 * cm)
        canvas.setFont("Arial", 8)
        canvas.setFillColor(colors.HexColor("#667085"))
        canvas.drawString(doc.leftMargin, height - 1.25 * cm, "EventHub - Τεκμηρίωση Εργασίας ΤΕΔ 2026")
        canvas.drawRightString(width - doc.rightMargin, 1.1 * cm, f"Σελίδα {doc.page}")
    canvas.restoreState()


def p(text: str, styles, style: str = "Body"):
    return Paragraph(text, styles[style])


def bullets(items: Iterable[str], styles):
    return ListFlowable(
        [ListItem(p(item, styles), leftIndent=12) for item in items],
        bulletType="bullet",
        start="circle",
        leftIndent=16,
        bulletFontName="Arial",
        bulletFontSize=8,
    )


def numbered(items: Iterable[str], styles):
    return ListFlowable(
        [ListItem(p(item, styles), leftIndent=12) for item in items],
        bulletType="1",
        leftIndent=18,
        bulletFontName="Arial",
        bulletFontSize=9,
    )


def table(data, col_widths, styles, header=True):
    rows = []
    for row in data:
        rows.append([
            cell if hasattr(cell, "wrap") else p(str(cell), styles, "Small")
            for cell in row
        ])
    t = Table(rows, colWidths=col_widths, hAlign="LEFT", repeatRows=1 if header else 0)
    commands = [
        ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#D0D5DD")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]
    if header:
        commands.extend([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E8EEF5")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#1F3A5F")),
            ("FONTNAME", (0, 0), (-1, 0), "Arial-Bold"),
        ])
    t.setStyle(TableStyle(commands))
    return t


def cover(styles):
    story = []
    story.append(Spacer(1, 2.1 * cm))
    story.append(p("Εφαρμογή Διαχείρισης Εκδηλώσεων και Ηλεκτρονικών Κρατήσεων", styles, "Title"))
    story.append(p("Τεκμηρίωση σχεδιασμού, υλοποίησης, εγκατάστασης και εκτέλεσης", styles, "Subtitle"))
    story.append(Spacer(1, 1.2 * cm))
    story.append(table([
        ["Μάθημα", "Τεχνολογίες Εφαρμογών Διαδικτύου"],
        ["Τμήμα", "Πληροφορικής & Τηλεπικοινωνιών"],
        ["Εξάμηνο", "ΣΤ΄ εξάμηνο σπουδών"],
        ["Έτος", "2026"],
    ], [4.0 * cm, 11.5 * cm], styles, header=False))
    story.append(Spacer(1, 1.2 * cm))
    story.append(p("Ομάδα εργασίας", styles, "Heading2"))
    story.append(table([
        ["Ονοματεπώνυμο", "Αριθμός Μητρώου"],
        ["[Συμπληρώστε ονοματεπώνυμο 1]", "[ΑΜ 1]"],
        ["[Συμπληρώστε ονοματεπώνυμο 2]", "[ΑΜ 2]"],
    ], [10.5 * cm, 5.0 * cm], styles))
    story.append(Spacer(1, 1.0 * cm))
    story.append(p("Τίτλος εφαρμογής: EventHub", styles, "CoverMeta"))
    story.append(p("Τεχνολογική στοίβα: Angular 17, NestJS, TypeORM, MySQL/MariaDB, JWT, SSL/TLS", styles, "CoverMeta"))
    story.append(PageBreak())
    return story


def toc(styles):
    toc_flow = TableOfContents()
    toc_flow.levelStyles = [
        ParagraphStyle(
            name="TOCLevel1",
            fontName="Arial",
            fontSize=10.5,
            leading=15,
            leftIndent=0,
            firstLineIndent=0,
            spaceBefore=4,
        ),
        ParagraphStyle(
            name="TOCLevel2",
            fontName="Arial",
            fontSize=9.5,
            leading=13,
            leftIndent=14,
            firstLineIndent=0,
            textColor=colors.HexColor("#475467"),
        ),
    ]
    return [p("Πίνακας περιεχομένων", styles, "TOCHeading"), toc_flow, PageBreak()]


def build_story(styles):
    story = []
    story.extend(cover(styles))
    story.extend(toc(styles))

    story.append(p("1. Εισαγωγή", styles, "Heading1"))
    story.append(p(
        "Η παρούσα τεκμηρίωση συνοδεύει την εφαρμογή EventHub, η οποία αναπτύχθηκε για την υποχρεωτική εργασία "
        "του μαθήματος Τεχνολογίες Εφαρμογών Διαδικτύου. Στόχος της εργασίας είναι η υλοποίηση διαδικτυακής "
        "εφαρμογής για διαχείριση εκδηλώσεων, ηλεκτρονικές κρατήσεις εισιτηρίων/θέσεων, επικοινωνία χρηστών, "
        "εξαγωγή δεδομένων και προβολή εξατομικευμένων συστάσεων με Biased Matrix Factorization.",
        styles,
    ))
    story.append(p(
        "Στα επόμενα κεφάλαια παρουσιάζονται οι απαιτήσεις που καλύπτονται, η αρχιτεκτονική, οι βασικές "
        "σχεδιαστικές αποφάσεις, το σχεσιακό μοντέλο, οι ρόλοι χρηστών, ο μηχανισμός κρατήσεων, το messaging, "
        "ο αλγόριθμος συστάσεων, οι οδηγίες εγκατάστασης/εκτέλεσης και οι δυσκολίες που αντιμετωπίστηκαν.",
        styles,
    ))

    story.append(p("2. Σύνοψη απαιτήσεων και λειτουργιών", styles, "Heading1"))
    story.append(p(
        "Η εκφώνηση απαιτεί εφαρμογή web browser / web server με τέσσερις ρόλους: διαχειριστή, διοργανωτή, "
        "συμμετέχοντα και επισκέπτη. Η υλοποίηση καλύπτει εγγραφή/έγκριση χρηστών, σύνδεση με JWT, δημιουργία "
        "και διαχείριση εκδηλώσεων, αναζήτηση με φίλτρα, κρατήσεις με έλεγχο διαθεσιμότητας, messaging, "
        "εξαγωγή XML/JSON και συστάσεις εκδηλώσεων.",
        styles,
    ))
    story.append(table([
        ["Απαίτηση", "Υλοποίηση"],
        ["SSL/TLS", "Το backend εκκινεί με HTTPS όταν υπάρχουν πιστοποιητικά στο backend/ssl. Το Angular dev server επικοινωνεί μέσω proxy."],
        ["Ρόλοι", "ADMIN, ORGANIZER, ATTENDEE και επισκέπτης χωρίς login για πλοήγηση/αναζήτηση."],
        ["Εκδηλώσεις", "CRUD, DRAFT/PUBLISHED/CANCELLED, κατηγορίες, τύποι εισιτηρίων, φωτογραφίες και χάρτης OpenStreetMap."],
        ["Κρατήσεις", "Έλεγχος χωρητικότητας και διαθέσιμων εισιτηρίων με συναλλαγή και pessimistic locking."],
        ["Messaging", "Εισερχόμενα/απεσταλμένα, unread count, soft delete και ειδοποίηση σε ακύρωση εκδήλωσης."],
        ["Export", "Εξαγωγή εκδηλώσεων σε XML συμβατό με τη δομή της εκφώνησης και αντίστοιχο JSON."],
        ["Recommendations", "Biased Matrix Factorization από κρατήσεις, views και imported dataset interactions."],
    ], [4.0 * cm, 11.8 * cm], styles))

    story.append(p("3. Αρχιτεκτονική συστήματος", styles, "Heading1"))
    story.append(p(
        "Η εφαρμογή ακολουθεί client-server αρχιτεκτονική. Το frontend είναι Angular 17 standalone application "
        "με Angular Material, ενώ το backend είναι NestJS REST API με TypeORM. Η βάση δεδομένων είναι MySQL/MariaDB. "
        "Η επικοινωνία πραγματοποιείται μέσω HTTPS και τα προστατευμένα endpoints απαιτούν JWT.",
        styles,
    ))
    story.append(table([
        ["Στρώμα", "Τεχνολογίες / αρχεία"],
        ["Frontend", "Angular 17, Angular Material, Leaflet. Κύρια services: frontend/src/app/core/services."],
        ["Backend", "NestJS modules: auth, users, events, bookings, messages, export, recommendations."],
        ["Persistence", "TypeORM entities για users, events, ticket_types, bookings, messages, views, recommendation_interactions."],
        ["Security", "Passport JWT strategy, guards ρόλων, ValidationPipe με whitelist/transform."],
        ["Static assets", "Φωτογραφίες στο backend/uploads και εξυπηρέτηση μέσω /uploads."],
    ], [4.0 * cm, 11.8 * cm], styles))
    story.append(p("3.1 Δομή πηγαίου κώδικα", styles, "Heading2"))
    story.append(p(
        "Το backend οργανώνεται ανά λειτουργική περιοχή. Τα entities βρίσκονται στο backend/src/entities, "
        "ενώ κάθε module έχει controller/service. Το frontend οργανώνεται σε core services/guards/interceptors "
        "και feature components για auth, home, events, bookings, messages και admin.",
        styles,
    ))

    story.append(p("4. Σχεσιακό μοντέλο και δεδομένα", styles, "Heading1"))
    story.append(p(
        "Το μοντέλο της βάσης ακολουθεί τις οντότητες της εκφώνησης και τις ανάγκες της εφαρμογής. Η εκδήλωση "
        "συσχετίζεται με διοργανωτή, κατηγορίες, τύπους εισιτηρίων, κρατήσεις, φωτογραφίες και προβολές χρηστών. "
        "Οι κρατήσεις συνδέουν συμμετέχοντα, εκδήλωση και τύπο εισιτηρίου.",
        styles,
    ))
    story.append(table([
        ["Πίνακας / Entity", "Ρόλος"],
        ["users", "Στοιχεία χρήστη, ρόλος, κατάσταση έγκρισης και optional external_dataset_id."],
        ["events", "Βασικά στοιχεία εκδήλωσης, κατάσταση, χωρητικότητα, διοργανωτής και metadata dataset."],
        ["event_categories", "Πολλαπλές κατηγορίες ανά εκδήλωση."],
        ["ticket_types", "Τιμή, ποσότητα και διαθέσιμο υπόλοιπο ανά τύπο εισιτηρίου."],
        ["bookings", "Κράτηση συμμετέχοντα, πλήθος εισιτηρίων, κόστος και status."],
        ["messages", "Μηνύματα με sender/receiver, read_at και flags διαγραφής."],
        ["user_event_views", "Ιστορικό προβολών για τον recommender."],
        ["recommendation_interactions", "Imported ratings από dataset για τον BMF."],
        ["user_friends", "Imported social links από dataset, διαθέσιμα για μελλοντική αξιοποίηση."],
    ], [5.0 * cm, 10.8 * cm], styles))
    story.append(p("Παραδοχή: σε development χρησιμοποιείται TypeORM synchronize για ταχεία δημιουργία πινάκων. Σε παραγωγικό περιβάλλον θα έπρεπε να αντικατασταθεί από migrations.", styles, "Callout"))

    story.append(p("5. Ρόλοι, αυθεντικοποίηση και εξουσιοδότηση", styles, "Heading1"))
    story.append(p(
        "Η αυθεντικοποίηση γίνεται με username/password και JWT. Ο κωδικός αποθηκεύεται ως bcrypt hash. "
        "Ο αρχικός διαχειριστής δημιουργείται αυτόματα κατά την εκκίνηση αν δεν υπάρχει. Οι νέοι χρήστες "
        "εγγράφονται ως ATTENDEE με κατάσταση PENDING και απαιτείται έγκριση από ADMIN.",
        styles,
    ))
    story.append(bullets([
        "JwtStrategy ελέγχει το token και ότι ο χρήστης είναι APPROVED.",
        "JwtAuthGuard προστατεύει endpoints που απαιτούν σύνδεση.",
        "RolesGuard περιορίζει λειτουργίες ανά ρόλο.",
        "OptionalJwtAuthGuard επιτρέπει public πρόσβαση σε event details, αλλά γράφει view όταν υπάρχει logged-in χρήστης.",
    ], styles))

    story.append(p("6. Διαχείριση εκδηλώσεων", styles, "Heading1"))
    story.append(p(
        "Οι διοργανωτές και οι διαχειριστές μπορούν να δημιουργούν εκδηλώσεις αρχικά ως DRAFT, να τις δημοσιεύουν, "
        "να τις τροποποιούν, να τις ακυρώνουν ή να τις διαγράφουν υπό προϋποθέσεις. Η εφαρμογή ελέγχει ότι το άθροισμα "
        "των ποσοτήτων εισιτηρίων δεν ξεπερνά τη συνολική χωρητικότητα.",
        styles,
    ))
    story.append(numbered([
        "Δημιουργία εκδήλωσης με τίτλο, κατηγορίες, τύπο, τόπο, ημερομηνίες, χωρητικότητα, περιγραφή και τύπους εισιτηρίων.",
        "Δημοσίευση μόνο από κατάσταση DRAFT.",
        "Επεξεργασία όσο η εκδήλωση δεν είναι CANCELLED.",
        "Διαγραφή μόνο για DRAFT εκδηλώσεις χωρίς κρατήσεις.",
        "Ακύρωση δημοσιευμένης εκδήλωσης χωρίς φυσική διαγραφή, ώστε να διατηρείται ιστορικότητα.",
    ], styles))

    story.append(p("7. Αναζήτηση και σελιδοποίηση εκδηλώσεων", styles, "Heading1"))
    story.append(p(
        "Η σελίδα αναζήτησης επιτρέπει φίλτρα τίτλου, κατηγορίας, πόλης, ημερομηνιών και τιμής. Τα query parameters "
        "περνούν από DTO με validation decorators, επειδή το global ValidationPipe χρησιμοποιεί whitelist. "
        "Χωρίς decorators τα φίλτρα απορρίπτονται, επομένως έγινε ρητή δήλωση των πεδίων στο EventFilterDto.",
        styles,
    ))
    story.append(p(
        "Η λίστα είναι σελιδοποιημένη τόσο στο frontend με MatPaginator όσο και στο backend με page/limit. "
        "Αντίστοιχη σελιδοποίηση υλοποιήθηκε για τις εκδηλώσεις διοργανωτή, τις κρατήσεις μιας εκδήλωσης και τις προτεινόμενες εκδηλώσεις.",
        styles,
    ))

    story.append(p("8. Μηχανισμός κρατήσεων", styles, "Heading1"))
    story.append(p(
        "Η κράτηση γίνεται μέσα σε database transaction. Χρησιμοποιείται pessimistic locking στην εκδήλωση και στον τύπο "
        "εισιτηρίου ώστε να αποφευχθούν race conditions όταν πολλοί χρήστες προσπαθούν να κλείσουν ταυτόχρονα θέσεις. "
        "Ελέγχεται τόσο η διαθεσιμότητα του συγκεκριμένου ticket type όσο και η συνολική χωρητικότητα.",
        styles,
    ))
    story.append(bullets([
        "Δεν επιτρέπεται κράτηση σε μη PUBLISHED ή CANCELLED εκδήλωση.",
        "Δεν επιτρέπεται ο διοργανωτής να κάνει κράτηση στη δική του εκδήλωση.",
        "Μετά την επιτυχή κράτηση μειώνεται το available του ticket type.",
        "Το total_cost υπολογίζεται από τιμή εισιτηρίου επί πλήθος εισιτηρίων.",
        "Σε ακύρωση εκδήλωσης οι σχετικές ενεργές κρατήσεις γίνονται CANCELLED.",
    ], styles))

    story.append(p("9. Messaging και ειδοποιήσεις", styles, "Heading1"))
    story.append(p(
        "Το σύστημα μηνυμάτων υποστηρίζει αποστολή, εισερχόμενα, απεσταλμένα, unread count, mark-as-read και soft delete. "
        "Τα μηνύματα δεν διαγράφονται φυσικά από τη βάση όταν ο χρήστης τα αφαιρεί από τα εισερχόμενα ή τα απεσταλμένα, "
        "αλλά σημειώνονται με deleted_by_receiver ή deleted_by_sender.",
        styles,
    ))
    story.append(p(
        "Σε περίπτωση ακύρωσης εκδήλωσης δημιουργούνται αυτόματα μηνύματα προς όλους τους μοναδικούς χρήστες που είχαν ενεργή κράτηση. "
        "Το μήνυμα αποστέλλεται με sender τον διοργανωτή και περιλαμβάνει αναφορά ότι η κράτηση ενημερώθηκε ως CANCELLED.",
        styles,
    ))

    story.append(p("10. Εξαγωγή XML και JSON", styles, "Heading1"))
    story.append(p(
        "Ο διαχειριστής μπορεί να εξάγει τις εκδηλώσεις σε JSON και XML. Η XML έξοδος παράγεται με xml2js και ακολουθεί "
        "τη δομή της εκφώνησης: EventID, Title, Category, EventType, Venue, Address, GeoLocation, TicketTypes, Bookings, "
        "Organizer, Status, Description και Media.",
        styles,
    ))
    story.append(p(
        "Η εξαγωγή φορτώνει τις απαραίτητες σχέσεις: categories, ticket_types, bookings, attendee, organizer και photos. "
        "Έτσι το αρχείο εξόδου είναι αυτοτελές και μπορεί να χρησιμοποιηθεί ως στιγμιότυπο των δεδομένων.",
        styles,
    ))

    story.append(p("11. Αλγόριθμος συστάσεων", styles, "Heading1"))
    story.append(p(
        "Οι προτεινόμενες εκδηλώσεις εμφανίζονται στην αρχική σελίδα του logged-in χρήστη. Το backend endpoint "
        "GET /recommendations δέχεται page και limit και επιστρέφει σελιδοποιημένο αποτέλεσμα. Ο αλγόριθμος "
        "Biased Matrix Factorization υλοποιείται από το μηδέν στο recommendations.service.ts.",
        styles,
    ))
    story.append(p("11.1 Πηγές δεδομένων", styles, "Heading2"))
    story.append(table([
        ["Πηγή", "Rating / χρήση"],
        ["Booking", "Rating 5, επειδή η κράτηση δείχνει ισχυρό ενδιαφέρον."],
        ["UserEventView", "Rating 2, επειδή η επίσκεψη σελίδας δείχνει ασθενέστερο ενδιαφέρον."],
        ["RecommendationInteraction", "Ratings 1..5 από το imported dataset."],
    ], [5.0 * cm, 10.8 * cm], styles))
    story.append(p("11.2 Μοντέλο", styles, "Heading2"))
    story.append(p(
        "Το μοντέλο υπολογίζει πρόβλεψη με τον τύπο r̂(u,i) = μ + b_u + b_i + p_u · q_i, όπου μ είναι ο μέσος όρος, "
        "b_u και b_i είναι biases χρήστη και εκδήλωσης, ενώ p_u και q_i είναι latent factor vectors. Οι παράμετροι "
        "είναι K=10, learning rate 0.005, regularization 0.02 και 30 epochs SGD.",
        styles,
    ))
    story.append(p(
        "Αν ο χρήστης δεν έχει ιστορικό, ή αν δεν υπάρχουν αρκετά δεδομένα για να παραχθεί σύσταση, ενεργοποιείται fallback "
        "σε δημοφιλείς δημοσιευμένες εκδηλώσεις, ταξινομημένες κυρίως με βάση τον αριθμό κρατήσεων.",
        styles,
    ))

    story.append(p("12. Ενσωμάτωση dataset συστάσεων", styles, "Heading1"))
    story.append(p(
        "Το dataset της εργασίας δεν αντιγράφεται στο repository, επειδή τα CSV είναι μεγάλα. Αντί αυτού δημιουργήθηκε "
        "streaming importer στο backend/scripts/import-rel-events-dataset.ts. Ο importer διαβάζει users.csv, events.csv, "
        "event_interest.csv, event_attendees.csv και user_friends.csv από DATASET_DIR και εισάγει ελεγχόμενο δείγμα στη βάση.",
        styles,
    ))
    story.append(p("Παράδειγμα εκτέλεσης importer:", styles))
    story.append(p("cd backend<br/>npm run import:dataset", styles, "Code"))
    story.append(p(
        "Οι imported χρήστες δημιουργούνται ως dataset_user_&lt;external_id&gt; με password από DATASET_PASSWORD. "
        "Τα imported events αποθηκεύουν external_dataset_id ώστε να αποφεύγονται διπλοεγγραφές σε επαναληπτικό import.",
        styles,
    ))

    story.append(p("13. Εγκατάσταση και εκτέλεση", styles, "Heading1"))
    story.append(p("13.1 Προαπαιτούμενα", styles, "Heading2"))
    story.append(bullets([
        "Node.js 18 ή νεότερο.",
        "npm 9 ή νεότερο.",
        "MySQL ή MariaDB.",
        "Self-signed SSL certificates στο backend/ssl ή εναλλακτικά μεταβλητές SSL_KEY_PATH και SSL_CERT_PATH.",
    ], styles))
    story.append(p("13.2 Βάση δεδομένων", styles, "Heading2"))
    story.append(p("CREATE DATABASE ted2026 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;", styles, "Code"))
    story.append(p("13.3 Backend", styles, "Heading2"))
    story.append(p(
        "Στο backend αντιγράφεται το .env.example σε .env και συμπληρώνονται DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, "
        "DB_NAME, JWT_SECRET, ADMIN_USERNAME και ADMIN_PASSWORD. Έπειτα εκτελούνται:",
        styles,
    ))
    story.append(p("cd backend<br/>npm install<br/>npm run start:dev", styles, "Code"))
    story.append(p("13.4 Frontend", styles, "Heading2"))
    story.append(p(
        "Το frontend χρησιμοποιεί proxy /api προς το HTTPS backend. Για development εκτελούνται:",
        styles,
    ))
    story.append(p("cd frontend<br/>npm install<br/>npm start", styles, "Code"))
    story.append(p("13.5 Παραγωγική εκτέλεση", styles, "Heading2"))
    story.append(p(
        "Για παραγωγική εκτέλεση μπορούν να δημιουργηθούν builds με npm run build σε backend και frontend. "
        "Το nginx.conf του repository μπορεί να χρησιμοποιηθεί ως βάση reverse proxy με SSL/TLS.",
        styles,
    ))

    story.append(p("14. Παραδοχές και περιορισμοί", styles, "Heading1"))
    story.append(bullets([
        "Δεν υλοποιείται πραγματική πληρωμή. Η κράτηση θεωρείται επιβεβαιωμένη μετά την οριστική υποβολή.",
        "Τα uploaded αρχεία φωτογραφιών αποθηκεύονται τοπικά στον φάκελο uploads.",
        "Το TypeORM synchronize χρησιμοποιείται για development και όχι ως βέλτιστη πρακτική παραγωγής.",
        "Ο recommender εκπαιδεύεται on demand στο request, επαρκές για την εργασία και μικρό/μεσαίο δείγμα, αλλά σε μεγάλη παραγωγική εγκατάσταση θα ήταν προτιμότερη περιοδική προεκπαίδευση/caching.",
        "Στο εξώφυλλο έχουν τοποθετηθεί placeholders για ονόματα ομάδας και αριθμούς μητρώου, επειδή δεν δόθηκαν στο workspace.",
        "Το dataset εισάγεται δειγματοληπτικά με μεταβλητές DATASET_MAX_* ώστε να αποφεύγεται υπερβολικός χρόνος import σε τοπικό περιβάλλον.",
    ], styles))

    story.append(p("15. Έλεγχος λειτουργίας", styles, "Heading1"))
    story.append(p(
        "Κατά την ανάπτυξη εκτελέστηκαν επαναλαμβανόμενα builds σε backend και frontend. Ελέγχθηκαν επίσης ειδικές ροές "
        "όπως σελιδοποίηση, αναζήτηση με query DTO, ακύρωση εκδήλωσης με ενημέρωση κρατήσεων/μηνυμάτων και fallback συστάσεων.",
        styles,
    ))
    story.append(table([
        ["Έλεγχος", "Ενδεικτική ενέργεια"],
        ["Build backend", "cd backend && npm run build"],
        ["Build frontend", "cd frontend && npm run build"],
        ["Αναζήτηση", "GET /events?title=Dataset%20Event%205&limit=12"],
        ["Συστάσεις", "GET /recommendations?page=1&limit=6 ως authenticated χρήστης"],
        ["Ακύρωση", "PATCH /events/:id/cancel και έλεγχος bookings/messages"],
    ], [5.0 * cm, 10.8 * cm], styles))

    story.append(p("16. Επίλογος", styles, "Heading1"))
    story.append(p(
        "Η ανάπτυξη της εφαρμογής κάλυψε το πλήρες φάσμα μιας σύγχρονης web εφαρμογής: σχεδιασμό σχεσιακής βάσης, "
        "REST API, αυθεντικοποίηση και εξουσιοδότηση, responsive frontend, κρατήσεις με έλεγχο συνέπειας, messaging, "
        "εξαγωγή XML/JSON και αλγόριθμο συστάσεων. Ιδιαίτερη προσοχή δόθηκε στη διατήρηση ιστορικότητας των δεδομένων "
        "και στην αποφυγή ασυνεπειών στις κρατήσεις.",
        styles,
    ))
    story.append(p(
        "Οι κυριότερες δυσκολίες αφορούσαν την ενσωμάτωση του μεγάλου dataset, τη σωστή σελιδοποίηση σε πολλά σημεία, "
        "την ασφαλή ενημέρωση χωρητικότητας σε συνθήκες ταυτόχρονων κρατήσεων και την αλληλεπίδραση του ValidationPipe "
        "με τα query φίλτρα. Αντιμετωπίστηκαν με streaming import, backend pagination, συναλλαγές με pessimistic locking "
        "και ρητή δήλωση DTO decorators για τα query parameters.",
        styles,
    ))
    story.append(p(
        "Ως μελλοντικές επεκτάσεις προτείνονται migrations αντί για synchronize, caching ή offline training για τον recommender, "
        "καλύτερη διαχείριση media σε object storage, πλήρες audit logging και εμπλουτισμός των analytics των εκδηλώσεων.",
        styles,
    ))

    return story


def main():
    register_fonts()
    styles = build_styles()
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    doc = ReportDocTemplate(
        OUT,
        pagesize=A4,
        rightMargin=1.65 * cm,
        leftMargin=1.65 * cm,
        topMargin=1.85 * cm,
        bottomMargin=1.65 * cm,
        title="Τεκμηρίωση Εργασίας ΤΕΔ 2026 - EventHub",
        author="Ομάδα εργασίας",
    )
    story = build_story(styles)
    doc.multiBuild(story)
    print(os.path.abspath(OUT).encode("ascii", "backslashreplace").decode("ascii"))


if __name__ == "__main__":
    main()
