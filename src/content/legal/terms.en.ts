// General Terms and Conditions — English convenience translation of the
// operator's supplied document.
//
// The Czech version in `terms.cs.ts` is the authoritative, binding one; this
// file is a translation provided for convenience only. In case of any
// discrepancy, the Czech wording prevails (see 14.7).
//
// The Czech source is reproduced verbatim from the operator's document. The one
// exception is the effective date in 14.8, which the operator corrected from
// "3.9. 2027" to 03.09.2026 — see the note in `terms.cs.ts`.
//
// Pending owner review — not yet signed off by the operator or a translator.
import type { LegalDocument } from './types';

export const TERMS_EN: LegalDocument = {
  version: '2026-09-03',
  eyebrow: '// LEGAL',
  title: 'General Terms and Conditions',
  sections: [
    {
      id: 'uvodni-ustanoveni',
      title: '1. Introductory provisions',
      body: [
        {
          type: 'p',
          text: '1.1. These general terms and conditions (the “GTC”) govern the rights and obligations between Mr Martin Mašek, a natural person doing business on the basis of a trade licence, with registered address at Václava Volfa 1337/37, 370 05 České Budějovice, Company ID: 23095571, entered in the trade register maintained by the Municipal Authority of the City of České Budějovice (the “operator”), and the customer when booking and using the services of the Clutch Zone gaming centres.',
        },
        {
          type: 'p',
          text: '1.2. These GTC apply in particular to the use of gaming computers, consoles and bootcamp zones, participation in tournaments, use of a customer account, the purchase of gaming hours, packages, vouchers, refreshments and other additional services provided at Clutch Zone branches (the “services”).',
        },
        {
          type: 'p',
          text: '1.3. Current information about branches, prices, opening hours, events, bookings and available services is published at https://clutchzone.club or available directly at the relevant branch.',
        },
        {
          type: 'p',
          text: '1.4. By using Clutch Zone services the customer confirms that they have read these GTC, the visitor rules and the price list.',
        },
        {
          type: 'p',
          text: '1.5. Terms stated for a specific offer, package, tournament, voucher or promotion take precedence over the general provisions of these GTC.',
        },
        {
          type: 'p',
          text: '1.6. For the purposes of these GTC, a consumer means any individual who, outside the scope of their business activity or the independent exercise of their profession, enters into a contract with the operator or otherwise deals with the operator. Provisions of these GTC that expressly concern consumers do not apply to other customers.',
        },
      ],
    },
    {
      id: 'identifikace-provozovatele',
      title: '2. Identification of the operator and branches',
      body: [
        { type: 'p', text: '2.1. Operator:' },
        {
          type: 'ul',
          items: [
            'Martin Mašek, a natural person doing business on the basis of a trade licence',
            'Registered address: Václava Volfa 1337/37, 370 05 České Budějovice',
            'Company ID: 23095571',
            'Entered in the trade register maintained by the Municipal Authority of the City of České Budějovice',
            'E-mail: info@clutchzone.club',
            'Web: https://clutchzone.club',
          ],
        },
        { type: 'p', text: '2.2. České Budějovice branch:' },
        {
          type: 'ul',
          items: [
            'Clutch Zone',
            'Address: Krajinská 2381/17, České Budějovice',
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
          text: '3.1. Services are booked primarily through the operator’s website, and alternatively by phone, by e-mail or directly at the branch.',
        },
        {
          type: 'p',
          text: '3.2. The booking system may be provided by a third party (in particular ggLeap / ggCircuit). The operator is not liable for short-term unavailability or technical faults of the external system that it did not cause.',
        },
        {
          type: 'p',
          text: '3.3. A booking may be paid in advance through the online payment gateway on the website, or in person at the venue before the service starts.',
        },
        { type: 'p', text: '3.4. Cancellation by the customer:' },
        {
          type: 'p',
          text: '3.4.1. Timely cancellation (more than 15 minutes in advance): The customer may cancel the booking free of charge no later than 15 minutes before its scheduled start, in particular using the link in the confirmation e-mail. In that case the amount paid is returned to the customer as credit in their user account in the booking system (or back to the payment card if they request so in writing).',
        },
        {
          type: 'p',
          text: '3.4.2. Late cancellation and no-show (less than 15 minutes in advance): If the customer cancels the booking less than 15 minutes before its start or does not arrive at the booked time, the booking is forfeited and the operator is entitled to keep 100 % of the amount paid as a cancellation fee for blocking the gaming seat.',
        },
        {
          type: 'p',
          text: '3.5. Customer delay: The customer is obliged to arrive at the booked time. If the customer knows they will be late, they must inform the operator in advance (by phone or e-mail). In that case, subject to agreement and current occupancy, the booking time may be moved. If the customer does not report the delay and does not arrive within 15 minutes of the start of the booking, their seat may be offered to other visitors with no entitlement to a refund.',
        },
        {
          type: 'p',
          text: '3.6. The operator reserves the right to cancel or change a booking for technical, operational or safety reasons. In that case the customer will be offered an alternative time or a full refund.',
        },
        {
          type: 'p',
          text: '3.7. A booking of a gaming seat for a specific date and time is a contract for the use of leisure time provided at a specified time. The consumer therefore has no right to withdraw from it within 14 days; see Article 12 of these GTC for details.',
        },
      ],
    },
    {
      id: 'ceny-a-platebni-podminky',
      title: '4. Prices and payment terms',
      body: [
        {
          type: 'p',
          text: '4.1. Service prices are stated in the current price list on the website, in the booking system or directly at the branch. Prices are stated in Czech crowns and include VAT where VAT is charged under the applicable legislation.',
        },
        {
          type: 'p',
          text: '4.2. Services are usually paid for at the branch in cash, by payment card or by another method permitted by the operator, or in advance online through the payment gateway.',
        },
        {
          type: 'p',
          text: '4.3. Playing on credit is not allowed. The customer must pay for the services before using them or as instructed by the staff.',
        },
        {
          type: 'p',
          text: '4.4. The operator does not accept damaged banknotes or banknotes whose authenticity cannot be verified.',
        },
        {
          type: 'p',
          text: '4.5. Discounts, bonuses, promotions and other benefits cannot be combined with each other unless stated otherwise for a specific offer.',
        },
        {
          type: 'p',
          text: '4.6. The operator will issue the customer a tax document or a receipt in accordance with the applicable legislation.',
        },
        {
          type: 'p',
          text: '4.7. Where the operator announces a discount on the price of a service or goods, it will at the same time state the lowest price at which it offered that service or those goods during the 30 days before the discount was granted. If the service or goods were placed on the market less than 30 days earlier, the operator will state the lowest price since they were placed on the market.',
        },
      ],
    },
    {
      id: 'herni-hodiny-balicky',
      title: '5. Gaming hours, packages, bonuses and gift vouchers',
      body: [
        {
          type: 'p',
          text: '5.1. The validity of purchased hours, packages, passes, vouchers, bonus hours or promo hours is governed by the terms of the specific offer, tariff or promotion.',
        },
        {
          type: 'p',
          text: '5.2. Unused hours expire once their validity period ends, unless stated otherwise for a specific offer. This provision is without prejudice to the consumer’s right to withdraw from the contract under Article 12 of these GTC.',
        },
        {
          type: 'p',
          text: '5.3. Bonus hours, promo hours and other discounted credits provided free of charge in addition to the price paid are not exchangeable for cash and cannot be paid back out, unless expressly stated otherwise.',
        },
        {
          type: 'p',
          text: '5.4. Hours, packages or a customer account may be transferred to another person only with the operator’s consent or under the terms of the specific offer.',
        },
        {
          type: 'p',
          text: '5.5. Gift vouchers may be used to the extent stated on the specific voucher or at the time of its purchase. Unless stated otherwise on the specific voucher, a gift voucher is valid for 12 months from the date of issue.',
        },
        {
          type: 'p',
          text: '5.6. Once a gift voucher has expired, no extension, exchange for cash or other performance may be claimed unless the operator and the customer agree otherwise. This is without prejudice to the consumer’s right to withdraw from the contract for the purchase of a gift voucher within the period under Article 12.',
        },
      ],
    },
    {
      id: 'turnaje-a-akce',
      title: '6. Tournaments and events',
      body: [
        {
          type: 'p',
          text: '6.1. Participation in tournaments is subject to a fee unless stated otherwise for the specific tournament.',
        },
        {
          type: 'p',
          text: '6.2. The conditions of participation, the entry fee, the tournament rules, the registration method, the options for cancelling participation and any refund of the entry fee are always stated for the specific tournament at registration.',
        },
        {
          type: 'p',
          text: '6.3. By completing registration for a tournament, the customer agrees to the rules and conditions of that tournament.',
        },
        {
          type: 'p',
          text: '6.4. The operator reserves the right to cancel or reschedule a tournament or change its format for organisational, technical or safety reasons. In that case customers will be informed of the next steps.',
        },
        {
          type: 'p',
          text: '6.5. A tournament held at a specified time is a leisure event within the meaning of Article 12.2 of these GTC; the right to withdraw from the contract within 14 days does not apply to a tournament entry. If the operator cancels the tournament, the entry fee is refunded in full.',
        },
      ],
    },
    {
      id: 'pravidla-vyuzivani',
      title: '7. Rules for using Clutch Zone services and premises',
      body: [
        {
          type: 'p',
          text: '7.1. The customer must follow the visitor rules, the instructions of the staff and the rules of decent behaviour.',
        },
        {
          type: 'p',
          text: '7.2. The customer must behave considerately towards other visitors, the staff, the equipment and the premises of the centre.',
        },
        {
          type: 'p',
          text: '7.3. The customer must not install prohibited programs, cheats, hacks, illegal software or any other unauthorised software.',
        },
        {
          type: 'p',
          text: '7.4. The customer must not disconnect cables, move peripherals between workstations, change the technical settings of devices or otherwise interfere with the equipment without the staff’s consent.',
        },
        {
          type: 'p',
          text: '7.5. Displaying offensive, discriminatory, extremist, pornographic or otherwise inappropriate content on the screens is prohibited.',
        },
        {
          type: 'p',
          text: '7.6. The customer must report technical problems, faults or damage to the equipment to the staff without delay.',
        },
        {
          type: 'p',
          text: '7.7. The staff are entitled to end a session or remove a visitor who breaches the rules. Repeated or serious breaches of the rules may lead to a temporary restriction or a ban on entry.',
        },
      ],
    },
    {
      id: 'deti-a-nezletili',
      title: '8. Children and underage visitors',
      body: [
        {
          type: 'p',
          text: '8.1. Children under 12 may use Clutch Zone services only when accompanied by a person over 18.',
        },
        {
          type: 'p',
          text: '8.2. A different age recommendation or restriction may be set for selected services, events, tournaments or games. Any such rule is stated for the specific offer, event or tournament.',
        },
        {
          type: 'p',
          text: '8.3. The legal guardian or the accompanying adult is responsible for the choice of games and the suitability of the content for an underage customer.',
        },
      ],
    },
    {
      id: 'obcerstveni-a-alkohol',
      title: '9. Refreshments and alcohol',
      body: [
        {
          type: 'p',
          text: '9.1. Only food and drinks purchased at the given Clutch Zone branch may be consumed on the premises of the centre. Consumption of your own food and drinks is not allowed unless the staff decide otherwise.',
        },
        {
          type: 'p',
          text: '9.2. Alcoholic drinks are sold and served only to persons over 18. The staff are entitled to ask the customer for proof of identity.',
        },
        {
          type: 'p',
          text: '9.3. If proof of identity is not presented or if there is doubt about the customer’s age, the staff may refuse to sell alcohol.',
        },
        {
          type: 'p',
          text: '9.4. Alcoholic drinks will not be sold or served to a person clearly under the influence of alcohol or another addictive substance.',
        },
        {
          type: 'p',
          text: '9.5. The operator reserves the right to refuse service to a customer whose behaviour may endanger the safety, order, equipment or comfort of other visitors.',
        },
      ],
    },
    {
      id: 'odpovednost-za-skodu',
      title: '10. Liability for damage and personal belongings',
      body: [
        {
          type: 'p',
          text: '10.1. The customer is liable for damage they cause to the operator, another customer or a third party, whether intentionally or through negligence.',
        },
        {
          type: 'p',
          text: '10.2. Intentional damage to the equipment, computers, consoles, peripherals, furniture or premises of the centre is prohibited. Any damage caused must be compensated.',
        },
        {
          type: 'p',
          text: '10.3. The operator is not liable for lost personal belongings or belongings left unattended by customers.',
        },
        {
          type: 'p',
          text: '10.4. The operator is not liable for outages, restrictions or errors caused by internet providers, software suppliers, gaming platforms, the external booking system, force majeure or other circumstances outside the operator’s direct control. This is without prejudice to the operator’s liability towards the consumer for the proper provision of a paid service under Article 11.',
        },
      ],
    },
    {
      // Footer "Reklamační řád" links to /terms#reklamace — keep this id.
      id: 'reklamace',
      title: '11. Service complaints',
      body: [
        {
          type: 'p',
          text: '11.1. If the customer finds a problem with the service provided, a technical fault or another obstacle preventing proper use of the service, they must report it to the staff without delay during the visit.',
        },
        {
          type: 'p',
          text: '11.2. If the complaint is justified, the operator may offer the customer a reasonable alternative solution, in particular extended time, a move to another seat, an alternative date or another form of compensation.',
        },
        {
          type: 'p',
          text: '11.3. A complaint can be made in person at the branch or by e-mail at info@clutchzone.club.',
        },
        {
          type: 'p',
          text: '11.4. The operator will issue the consumer written confirmation of when the complaint was made, what it concerns and what method of settlement is requested.',
        },
        {
          type: 'p',
          text: '11.5. The operator will decide on the complaint immediately, or in complex cases within three working days. That period does not include the time reasonably needed, according to the type of service, for an expert assessment of the defect. The operator will settle the complaint, including remedying the defect, no later than 30 days from the day it was made, unless a longer period is agreed with the consumer. Failure to meet this deadline is considered a material breach of contract.',
        },
        {
          type: 'p',
          text: '11.6. After settling the complaint, the operator will issue the consumer a confirmation of the date and manner of settlement, or written reasons for its rejection.',
        },
      ],
    },
    {
      // The credit-purchase confirmation e-mail links here (/terms#odstoupeni).
      id: 'odstoupeni',
      title: '12. Withdrawal from a distance contract',
      body: [
        {
          type: 'p',
          text: '12.1. This Article applies only to a consumer who has entered into a contract with the operator by distance means, i.e. in particular through the website or the booking system.',
        },
        {
          type: 'p',
          text: '12.2. A booking of a gaming seat, gaming device or bootcamp zone, or participation in a tournament on a specific date and time, is a contract for the use of leisure time which the operator provides at a specified time. Under Section 1837(j) of the Civil Code the consumer therefore has no right to withdraw from such a contract within 14 days. Cancellation terms are governed by Article 3.4 of these GTC.',
        },
        {
          type: 'p',
          text: '12.3. For purchases of gaming hours, credit, packages, passes and gift vouchers that are not tied to a specific date and time of service provision, the consumer has the right to withdraw from the contract without giving a reason within 14 days of the date the contract was concluded.',
        },
        {
          type: 'p',
          text: '12.4. To withdraw from the contract under Article 12.3, the consumer may use:',
        },
        {
          type: 'ul',
          items: [
            'a) the withdrawal button available in the purchase confirmation e-mail and on the operator’s website,',
            'b) the model withdrawal form which forms Annex 1 to these GTC, or',
            'c) any other unambiguous statement sent to the operator’s e-mail address or registered address.',
          ],
        },
        {
          type: 'p',
          text: 'The withdrawal period is observed if the consumer sends the withdrawal no later than the last day of the period.',
        },
        {
          type: 'p',
          text: '12.5. The operator will confirm receipt of the withdrawal to the consumer in text form without undue delay.',
        },
        {
          type: 'p',
          text: '12.6. If the consumer withdraws from the contract, the operator will return all funds received from them under the contract without undue delay and no later than 14 days after the withdrawal, in the same way as they were received, unless agreed otherwise.',
        },
        {
          type: 'p',
          text: '12.7. If the consumer expressly requested that the provision of the service begin before the withdrawal period expired and the service had been partly used by the time of withdrawal, the consumer will pay the operator a proportionate part of the price corresponding to the performance already provided. If the service was provided in full, the right to withdraw under Section 1837(a) of the Civil Code ceases to exist.',
        },
        {
          type: 'p',
          text: '12.8. For the purposes of Article 12.7, credit purchased is deemed used to the extent it has already been used by the consumer to pay for a specific service.',
        },
      ],
    },
    {
      id: 'ochrana-osobnich-udaju',
      title: '13. Personal data protection',
      body: [
        {
          type: 'p',
          text: '13.1. Information about the processing of customers’ personal data is set out in the separate document “Personal data protection” available on the operator’s website.',
        },
        {
          type: 'p',
          text: '13.2. Information about cookies and consent settings is set out in the separate document “Cookie settings” available on the operator’s website at https://clutchzone.club/cookies.',
        },
      ],
    },
    {
      id: 'zaverecna-ustanoveni',
      title: '14. Final provisions',
      body: [
        { type: 'p', text: '14.1. These GTC are governed by the law of the Czech Republic.' },
        {
          type: 'p',
          text: '14.2. If any provision of these GTC is invalid or ineffective, this does not affect the validity and effectiveness of the remaining provisions.',
        },
        {
          type: 'p',
          text: '14.3. The operator is entitled to amend these GTC. A new version of the GTC takes effect on the day it is published on the website, unless stated otherwise. Contracts already concluded are governed by the version of the GTC in effect on the day the contract was concluded.',
        },
        {
          type: 'p',
          text: '14.4. Supervision of compliance with obligations under Act No. 634/1992 Coll., on consumer protection, is exercised by the Czech Trade Inspection Authority.',
        },
        {
          type: 'p',
          text: '14.5. The body competent for the out-of-court resolution of consumer disputes arising from a contract concluded between the operator and a consumer is the Czech Trade Inspection Authority, with its registered office at Štěpánská 796/44, 110 00 Prague 1, website: https://www.coi.cz. The consumer may use this procedure if the dispute cannot be resolved with the operator directly. This is without prejudice to the right to bring the matter before a court.',
        },
        { type: 'p', text: '14.6. These GTC are available at https://clutchzone.club' },
        {
          type: 'p',
          text: '14.7. These GTC are published in Czech, English, German and Ukrainian. In the event of any discrepancy between the language versions, the Czech version prevails.',
        },
        { type: 'p', text: '14.8. These GTC take effect on 03.09.2026.' },
      ],
    },
    {
      id: 'vzorovy-formular',
      title: 'Annex 1 — Model withdrawal form',
      body: [
        {
          type: 'p',
          text: '(Complete and return this form only if you wish to withdraw from the contract.)',
        },
        { type: 'p', text: 'Addressee:' },
        {
          type: 'ul',
          items: [
            'Martin Mašek, Václava Volfa 1337/37, 370 05 České Budějovice, Company ID: 23095571',
            'E-mail: info@clutchzone.club',
          ],
        },
        {
          type: 'p',
          text: 'I hereby give notice that I withdraw from the contract for the provision of the following services / for the purchase of the following goods:',
        },
        {
          type: 'ul',
          items: [
            '……………………………………………………………………………………………………',
            'Date of order / date of receipt: ……………………………………………………………',
            'Order number: ………………………………………………………………………………',
            'Consumer’s name and surname: …………………………………………………………………',
            'Consumer’s address: ……………………………………………………………………………',
            'Consumer’s e-mail: ……………………………………………………………………………',
            'Account / card number for the refund: …………………………………………………………',
            'Consumer’s signature (only if this form is sent on paper): ……………………',
            'Date: …………………………………………………',
          ],
        },
      ],
    },
  ],
};
