import { Component, computed, effect, inject, OnInit } from '@angular/core';
import { AccountsContainerComponent } from '../accounts-container/accounts-container.component';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { ProgramStore } from '../../store/program.store';
import { PromoterStore } from '../../store/promoter.store';
import { onRegisterForProgramSuccess, TncStore } from './store/tnc.store';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
	selector: 'app-terms-and-conditions',
	imports: [
		AccountsContainerComponent,
		MatButtonModule,
		MatCardModule
	],
	providers: [TncStore],
	templateUrl: './terms-and-conditions.component.html',
	styleUrl: './terms-and-conditions.component.scss'
})
export class TermsAndConditionsComponent implements OnInit {

	programStore = inject(ProgramStore);
	promoterStore = inject(PromoterStore);
	tncStore = inject(TncStore);

	readonly programId = computed(() => this.programStore.program()!.programId);
	readonly promoterId = computed(() => this.promoterStore.promoter()!.promoterId);

	tncTextTemp = `
		These Terms and Conditions govern your participation in the Logoipsum Affiliate Program. By signing up as an affiliate, you agree to abide by the terms detailed below.

1. What is the Affiliate Program?
Logoipsum’s Affiliate Program is a performance-based partnership that rewards you for referring new users to Logoipsum’s products and services. You’ll earn a commission every time someone signs up or makes a purchase through your unique affiliate link.

2. Who Can Join?
Anyone over 18 years old with a valid Indian PAN and a functioning bank account can apply. We especially welcome bloggers, YouTubers, creators, educators, influencers, and community leaders who speak about finance, productivity, or digital tools.
Once you apply, our team will review your submission. We reserve the right to approve or decline applications at our sole discretion—particularly if your content misrepresents or violates our brand principles.

3. How It Works
After approval, you’ll receive a unique affiliate link. You can share it on your website, newsletter, social media, or any platform where you believe your audience would benefit from Logoipsum.
Here’s how your referrals will be counted:
A signup is when someone clicks your link and creates an account on Logoipsum, verifying their email.
A purchase is when someone who came through your link completes a paid transaction (like filing a return, paying a tax, or syncing an investment portfolio).
To ensure attribution, both actions must be completed within 30 days of the user clicking your affiliate link. If multiple affiliates refer the same person, the last one gets the credit.
4. What You’ll Earn
You’ll earn a fixed commission for every verified signup, and a percentage of the total net value of any purchases made by your referrals.
For each verified signup: you earn a flat reward.
For every qualifying purchase: you earn a percentage of the amount paid (excluding taxes and refunds).
There’s no limit on how much you can earn.
5. When and How You Get Paid
Payments are processed once a month, by the 10th of each following month.
To receive a payout:
You must have earned at least ₹500.
Your bank details must be correct and verified in your affiliate dashboard.
Commissions below the threshold will roll over to the next month. All payments are made via NEFT or IMPS.
6. What’s Allowed and What’s Not
We want you to succeed—honestly and transparently.
You can:
Write blog posts or make videos about your experience with Logoipsum.
Share your affiliate link on social media, email newsletters, and communities you actively participate in.
Promote through personal conversations and direct recommendations.
You cannot:
Use Google Ads or any paid ads with brand terms like “Logoipsum”.
Pretend to be Logoipsum or mislead users about our services.
Spam, mislead, or trick people into signing up.
Use your own link to claim commissions (self-referrals).
Violating these rules may lead to account suspension and forfeiture of pending commissions.
7. Tracking and Attribution
Tracking is powered by browser cookies and is valid for 30 days after a user clicks your affiliate link. If the user clears cookies or uses a different browser/device, we may not be able to track them accurately.
We recommend nudging your referrals to complete their signup or purchase in the same session for best results.
8. Ending Your Participation
You can opt out anytime by emailing us. Likewise, Logoipsum reserves the right to suspend or terminate your affiliate account at any time—especially in case of misuse, inactivity, or violations of these Terms.
9. Liability Disclaimer
While we do our best to track, report, and process payments accurately, Logoipsum is not liable for:
Technical glitches or tracking issues beyond our control.
Loss of commissions due to browser restrictions or user behavior.
Delays in payouts due to incomplete or incorrect information provided by you.
10. Updates to This Policy
These Terms may change from time to time. We’ll notify you of significant updates, but it’s your responsibility to stay informed. Your continued participation means you accept the updated Terms.
11. Need Help?
We’re here for you. For any questions or issues, reach out to our team at affiliates@logoipsum.com
Let’s grow together.
	`;

	constructor(
		private router: Router,
		private route: ActivatedRoute
	) { }

	ngOnInit(): void {
		onRegisterForProgramSuccess.subscribe(() => {
			this.promoterStore.updatePromoterTncAcceptedStatus(true);
			this.router.navigate(['../home'], { relativeTo: this.route });
		});
	}

	onSubmit() {
		this.tncStore.registerForProgram({
			programId: this.programId(),
			promoterId: this.promoterId(),
		});
	}

	onCancel() {
		this.router.navigate(['../login'], { relativeTo: this.route });
	}

}
