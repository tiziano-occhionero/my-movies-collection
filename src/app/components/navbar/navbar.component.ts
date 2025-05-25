import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [NgIf, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  constructor(private router: Router) {}

  isInserimentoPage(): boolean {
    return this.router.url.includes('inserimento');
  }

  isCercaPage(): boolean {
    return this.router.url.includes('cerca');
  }
}
