import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, fromEvent, merge, of } from 'rxjs';
import { mapTo, startWith } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NetworkService {
  private onlineStatus$ = new BehaviorSubject<boolean>(navigator.onLine);

  constructor(private ngZone: NgZone) {
    const online$ = fromEvent(window, 'online').pipe(mapTo(true));
    const offline$ = fromEvent(window, 'offline').pipe(mapTo(false));

    merge(online$, offline$)
      .pipe(startWith(navigator.onLine))
      .subscribe(status => {
        this.ngZone.run(() => {
          this.onlineStatus$.next(status);
        });
      });
  }

  isOnline() {
    return this.onlineStatus$.asObservable();
  }

  getCurrentStatus(): boolean {
    return this.onlineStatus$.value;
  }
}
