// Terms and Conditions — English convenience translation of the operator's
// supplied document.
//
// The Czech version in `terms.cs.ts` is the authoritative, binding one; this
// file is a translation provided for convenience only. In case of any
// discrepancy, the Czech wording prevails.
//
// The Czech source is reproduced verbatim from the operator's document,
// including apparent errors (the company register named in 1.1, the stray
// punctuation in 1.1, the two clauses both numbered 3.4.1, and the
// "MVP ESports" / "MVP Esports" references in 7 and 9.1). Those oddities were
// preserved here intentionally — do not "fix" them.
//
// Pending owner review — not yet signed off by the operator or a translator.
import type { LegalDocument } from './types';

export const TERMS_EN: LegalDocument = {
  version: '2026-08-30',
  eyebrow: '// LEGAL',
  title: 'Terms and Conditions',
  sections: [
    {
      id: 'uvodni-ustanoveni',
      title: '1. Introductory provisions',
      body: [
        {
          type: 'p',
          text: '1.1. These general terms and conditions (hereinafter the “GTC”) govern the rights and obligations between the company Martin Mašek., with its registered office at Václava Volfa 1337/37, Company ID (IČO): 23095571, registered in the Commercial Register maintained by the Municipal Court in České Budějovice, hereinafter the “operator”), and the customer when booking and using the services of the Clutch Zone gaming centres.',
        },
        {
          type: 'p',
          text: '1.2. These GTC apply in particular to the use of gaming computers, consoles, bootcamp zones, participation in tournaments, use of a customer account, the purchase of gaming hours, packages, vouchers, refreshments and other supplementary services provided at Clutch Zone branches (hereinafter the “services”).',
        },
        {
          type: 'p',
          text: '1.3. Current information about branches, prices, opening hours, promotions, bookings and available services is published on the website https://clutchzone.club or directly at the particular branch.',
        },
        {
          type: 'p',
          text: '1.4. By using Clutch Zone services the customer confirms that they have familiarised themselves with these GTC, the visitor rules and the price list of services.',
        },
        {
          type: 'p',
          text: '1.5. Arrangements stated with a particular offer, package, tournament, voucher or promotional campaign take precedence over the general provisions of these GTC.',
        },
      ],
    },
    {
      id: 'identifikace-provozovatele',
      title: '2. Identification of the operator and the branches',
      body: [
        { type: 'p', text: '2.1. Operator:' },
        {
          type: 'ul',
          items: [
            'Martin Mašek',
            'Registered office: Václava Volfa 1337/37',
            'Company ID (IČO): 23095571',
            'Web: https://clutchzone.club',
          ],
        },
        { type: 'p', text: '2.2. České Budějovice branch:' },
        {
          type: 'ul',
          items: [
            'Clutch Zone',
            'Address: Krajinská 2381/17',
            'Phone: +420 733 104 289',
            'E-mail: info@clutchzone.club',
          ],
        },
      ],
    },
    {
      id: 'rezervace-a-storno',
      title: '3. Bookings and cancellation terms',
      body: [
        {
          type: 'p',
          text: '3.1. Services are booked primarily through the operator’s website, alternatively by phone, by e-mail or directly at the branch.',
        },
        {
          type: 'p',
          text: '3.2. The booking system may be provided by a third party (in particular the ggLeap / ggCircuit system). The operator is not liable for short-term unavailability or technical faults of the external system unless it caused them.',
        },
        {
          type: 'p',
          text: '3.3. A booking may be paid in advance through the online payment gateway on the website, or in person at the gaming centre before the service starts being provided.',
        },
        { type: 'p', text: '3.4. Cancellation of a booking by the customer:' },
        {
          type: 'p',
          text: '3.4.1 Timely cancellation (more than 15 minutes in advance): The customer may cancel a booking free of charge no later than 15 minutes before its scheduled start. In such a case the amount paid is returned to the customer in the form of credit to their user account in the booking system (or back to the payment card if they request so in writing).',
        },
        {
          type: 'p',
          text: '3.4.1. Late cancellation and no-show (less than 15 minutes in advance): If the customer cancels the booking less than 15 minutes before its start or does not turn up at the booked time, the booking lapses and the operator is entitled to keep 100 % of the amount paid as a cancellation fee for blocking the gaming seat.',
        },
        {
          type: 'p',
          text: '3.5. Customer being late: The customer is obliged to arrive at the booked time. If the customer knows they will be late, they are obliged to inform the operator in advance (by phone or e-mail). In such a case the booking time may be moved by agreement and with regard to the current occupancy. If the customer does not report the delay and does not arrive within 15 minutes of the start of the booking, their station may be offered to other interested parties with no entitlement to a refund.',
        },
        {
          type: 'p',
          text: '3.6. The operator reserves the right to cancel or change a booking for technical, operational or safety reasons. In such a case the customer will be offered an alternative date or refunded the payment in full.',
        },
      ],
    },
    {
      id: 'ceny-a-platebni-podminky',
      title: '4. Prices and payment terms',
      body: [
        {
          type: 'p',
          text: '4.1. The prices of services are stated in the current price list on the website, in the booking system or directly at the branch. Prices are stated in Czech crowns and include VAT where VAT is charged under the legal regulations.',
        },
        {
          type: 'p',
          text: '4.2. Payment for services is generally made at the branch in cash, by payment card or by another method permitted by the operator.',
        },
        {
          type: 'p',
          text: '4.3. Playing on credit is not permitted. The customer is obliged to pay for the services before using them or as instructed by the staff.',
        },
        {
          type: 'p',
          text: '4.4. The operator does not accept damaged banknotes or banknotes whose authenticity cannot be verified.',
        },
        {
          type: 'p',
          text: '4.5. Discounts, bonuses, promotional campaigns and other benefits cannot be combined with one another unless stated otherwise with the particular offer.',
        },
        {
          type: 'p',
          text: '4.6. The operator will issue the customer a tax document or a receipt in accordance with the applicable legal regulations.',
        },
      ],
    },
    {
      id: 'herni-hodiny-balicky',
      title: '5. Gaming hours, packages, bonuses and gift vouchers',
      body: [
        {
          type: 'p',
          text: '5.1. The validity of purchased hours, packages, season passes, vouchers, bonus hours or promotional hours is governed by the terms of the particular offer, tariff or promotional campaign.',
        },
        {
          type: 'p',
          text: '5.2. Unused hours lapse once the validity period expires, unless stated otherwise with the particular offer.',
        },
        {
          type: 'p',
          text: '5.3. Bonus hours, promotional hours and other preferential credits are not exchangeable for cash and cannot be paid back, unless expressly stated otherwise.',
        },
        {
          type: 'p',
          text: '5.4. Transferring hours, packages or a customer account to another person is possible only with the operator’s consent or under the terms of the particular offer.',
        },
        {
          type: 'p',
          text: '5.5. Gift vouchers may be used to the extent stated on the particular voucher or at the time of its purchase. Unless stated otherwise on the particular voucher, the validity of a gift voucher is 12 months from the date of its issue.',
        },
        {
          type: 'p',
          text: '5.6. Once the validity of a gift voucher has expired, its extension, exchange for cash or any other performance cannot be demanded, unless the operator agrees otherwise with the customer.',
        },
      ],
    },
    {
      id: 'turnaje-a-akce',
      title: '6. Tournaments and events',
      body: [
        {
          type: 'p',
          text: '6.1. Participation in tournaments is subject to a fee, unless stated otherwise for the particular tournament.',
        },
        {
          type: 'p',
          text: '6.2. The conditions of participation, the amount of the entry fee, the tournament rules, the method of registration, the options for cancelling participation and any refund of the entry fee are always stated with the particular tournament at registration.',
        },
        {
          type: 'p',
          text: '6.3. If the customer completes registration for a tournament, they agree to the rules and conditions of that particular tournament.',
        },
        {
          type: 'p',
          text: '6.4. The operator reserves the right to cancel or reschedule a tournament or change its format for organisational, technical or safety reasons. In such a case customers will be informed of the further procedure.',
        },
      ],
    },
    {
      id: 'pravidla-vyuzivani',
      title: '7. Rules for using the services and premises of MVP Esports',
      body: [
        {
          type: 'p',
          text: '7.1. The customer is obliged to observe the visitor rules, the instructions of the staff and the rules of decent behaviour.',
        },
        {
          type: 'p',
          text: '7.2. The customer is obliged to behave considerately towards other visitors, the staff, the equipment and the premises of the centre.',
        },
        {
          type: 'p',
          text: '7.3. The customer must not install prohibited programs, cheats, hacks, illegal software or any other unauthorised software.',
        },
        {
          type: 'p',
          text: '7.4. The customer must not disconnect cables, move peripheral devices between workstations, change the technical settings of devices or otherwise interfere with the equipment without the staff’s consent.',
        },
        {
          type: 'p',
          text: '7.5. Displaying offensive, discriminatory, extremist, pornographic or otherwise inappropriate content on the screens is prohibited.',
        },
        {
          type: 'p',
          text: '7.6. The customer is obliged to report technical problems, defects or damage to the equipment to the staff without delay.',
        },
        {
          type: 'p',
          text: '7.7. The staff are entitled to end a session or expel a visitor who breaches the rules. Repeated or serious breaches of the rules may lead to a temporary restriction or a ban on entry.',
        },
      ],
    },
    {
      id: 'deti-a-nezletili',
      title: '8. Children and underage visitors',
      body: [
        {
          type: 'p',
          text: '8.1. Children under 12 years of age may use Clutch Zone services only when accompanied by a person over 18 years of age.',
        },
        {
          type: 'p',
          text: '8.2. A different age recommendation or restriction may be set for selected services, events, tournaments or games. Any such rule is stated with the particular offer, event or tournament.',
        },
        {
          type: 'p',
          text: '8.3. The legal representative or the accompanying adult is responsible for the choice of games and the suitability of the content for an underage customer.',
        },
      ],
    },
    {
      id: 'obcerstveni-a-alkohol',
      title: '9. Refreshments and alcohol',
      body: [
        {
          type: 'p',
          text: '9.1. Only food and drinks purchased at the given MVP ESports branch may be consumed on the premises of the centre. Consumption of one’s own food and drinks is not permitted unless the staff decide otherwise.',
        },
        {
          type: 'p',
          text: '9.2. Alcoholic drinks are sold and served only to persons over 18 years of age. The staff are entitled to ask the customer to present proof of identity.',
        },
        {
          type: 'p',
          text: '9.3. If proof of identity is not presented or there is doubt about the customer’s age, the staff may refuse to sell alcohol.',
        },
        {
          type: 'p',
          text: '9.4. Alcoholic drinks will not be sold or served to a person who is visibly under the influence of alcohol or another addictive substance.',
        },
        {
          type: 'p',
          text: '9.5. The operator reserves the right to refuse to serve a customer whose behaviour may endanger the safety, order, equipment or comfort of other visitors.',
        },
      ],
    },
    {
      id: 'odpovednost-za-skodu',
      title: '10. Liability for damage and personal belongings',
      body: [
        {
          type: 'p',
          text: '10.1. The customer is liable for damage they cause to the operator, to another customer or to a third party intentionally or through negligence.',
        },
        {
          type: 'p',
          text: '10.2. Intentional damage to the equipment, computers, consoles, peripherals, furniture or premises of the centre is prohibited. Any damage caused must be compensated.',
        },
        {
          type: 'p',
          text: '10.3. The operator is not liable for lost personal belongings or for personal belongings left unattended by customers.',
        },
        {
          type: 'p',
          text: '10.4. The operator is not liable for outages, restrictions or errors caused by internet providers, software suppliers, gaming platforms, the external booking system, force majeure or other circumstances outside the operator’s direct control.',
        },
      ],
    },
    {
      // Footer "Reklamační řád" links to /terms#reklamace — keep this id.
      id: 'reklamace',
      title: '11. Complaints about services',
      body: [
        {
          type: 'p',
          text: '11.1. If the customer discovers a problem with the service provided, a technical fault or another obstacle preventing the proper use of the service, they are obliged to report it to the staff without delay during their visit.',
        },
        {
          type: 'p',
          text: '11.2. If the complaint is justified, the operator may offer the customer a reasonable alternative solution, in particular an extension of time, a move to another seat, an alternative date or another form of compensation.',
        },
        {
          type: 'p',
          text: '11.3. Complaints can be handled in person at the branch or by e-mail to the contact address of the relevant branch.',
        },
      ],
    },
    {
      id: 'ochrana-osobnich-udaju',
      title: '12. Personal data protection',
      body: [
        {
          type: 'p',
          text: '12.1. Information about the processing of customers’ personal data is set out in a separate document, “Personal data protection”, available on the operator’s website.',
        },
        {
          type: 'p',
          text: '12.2. Information about cookies is set out in a separate document, “Cookie settings”.',
        },
      ],
    },
    {
      id: 'zaverecna-ustanoveni',
      title: '13. Final provisions',
      body: [
        { type: 'p', text: '13.1. These GTC are governed by the law of the Czech Republic.' },
        {
          type: 'p',
          text: '13.2. If any provision of these GTC is invalid or ineffective, this does not affect the validity and effectiveness of the remaining provisions.',
        },
        {
          type: 'p',
          text: '13.3. The operator is entitled to amend these GTC. The new wording of the GTC takes effect on the day it is published on the website, unless stated otherwise.',
        },
        {
          type: 'p',
          text: '13.4. These GTC are available on the website https://clutchzone.club.',
        },
      ],
    },
  ],
};
