import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { getMember } from '../../store/member-store/member-store.selector';
import { MemberDto } from '../../../../org-quicko-cliq-core/src/lib/dtos/member.dto';

@Component({
	selector: 'app-home',
	templateUrl: './home.component.html',
	styleUrl: './home.component.scss',
	standalone: true,
})
export class HomeComponent {

	public member$: Observable<MemberDto> = this.store.select(getMember());

	constructor(
		private router: Router,
		private store: Store,
		private route: ActivatedRoute,
	) { }

	ngOnInit() {

	}

	goToRoute(route: string) {
		this.router.navigate([route]);
	}
}
