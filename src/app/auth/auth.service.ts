
import { Subject } from "rxjs";
import { Injectable } from "@angular/core";
import { HttpClient } from '@angular/common/http';
import { AuthData } from "./auth-data.model";
import { Router } from "@angular/router";
import { environment } from "src/environments/environment";

const BACKEND_URL = environment.apiUrl + '/user';

@Injectable({providedIn: 'root'})
export class AuthService {
  private token: string;
  private userId: string;
  private isAuthenticated = false;
  private tokenTimer: NodeJS.Timer;
  private authStatusListener = new Subject<boolean>();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  createUser(email: string, password: string) {
    const authData: AuthData = {email, password};
    this.http.post(BACKEND_URL + '/signup', authData)
    .subscribe(response => {
      this.router.navigate(['/']);
    }, error => {
      this.authStatusListener.next(false);
    })
  };

  login(email: string, password: string) {
    const authData: AuthData = {email, password};
    this.http
    .post<{token: string, expiresIn: number, userId: string}>(BACKEND_URL + '/login', authData)
      .subscribe((res: any) => {
        this.token = res.token;
        if (res.token) {
          const expiresInDuration = res.expiresIn;
          this.setAuthTimer(expiresInDuration);
          this.isAuthenticated = true;
          this.userId = res.userId;
          const expirationDate = new Date(new Date().getTime() + expiresInDuration*1000);
          console.log(expirationDate);
          this.saveAuthData(res.token, expirationDate, this.userId);
          this.authStatusListener.next(this.isAuthenticated);
          this.router.navigate(['/']);
        };
      }, error => {
        this.authStatusListener.next(false);
      })
  }

  getIsAuth() {
    return this.isAuthenticated;
  }

  getUserId() {
    return this.userId;
  }

  getAuthStatusListener() {
    return this.authStatusListener.asObservable();
  }

  getToken() {
    return this.token;
  }

  autoAuthUser() {
    const authInformation = this.getAuthData();
    if (!authInformation) {
      return;
    };
    const now = new Date();
    const expiresIn = authInformation.expirationDate.getTime() - now.getTime();
    if (authInformation.expirationDate > now) {
      this.token = authInformation.token;
      this.setAuthTimer(expiresIn / 1000);
      this.isAuthenticated = true;
      this.userId = authInformation.userId;
      this.authStatusListener.next(true);
    }
  }

  private setAuthTimer(duration: number) {
    console.log('setting timer: ' + duration);
    this.tokenTimer = setTimeout(() => {
      this.logout();
    }, duration * 1000);
  }

  logout() {
    this.token = null;
    this.tokenTimer = null;
    this.isAuthenticated = false;
    this.authStatusListener.next(this.isAuthenticated);
    clearTimeout(this.tokenTimer);
    this.clearAuthData();
    this.userId = null;
    this.router.navigate(['/']);
  }

  private saveAuthData(token: string, expirationDate: Date, userId: string) {
    localStorage.setItem('token', token);
    localStorage.setItem('expiration', expirationDate.toISOString());
    localStorage.setItem('userId', userId);
  }

  private clearAuthData() {
    localStorage.removeItem('token');
    localStorage.removeItem('expiration');
    localStorage.removeItem('userId');
  }

  private getAuthData() {
    const token = localStorage.getItem('token');
    const expirationDate = localStorage.getItem('expiration');
    const userId = localStorage.getItem('userId');
    if (!token || !expirationDate) {
      return;
    }
    return {
      token,
      expirationDate: new Date(expirationDate),
      userId
    }
  }
}
