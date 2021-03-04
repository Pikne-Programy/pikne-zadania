import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as ServerRoutes from '../server-routes';
import { pbkdf2 } from '../helper/utils';

@Injectable({
  providedIn: 'root',
})
export class AccountService {
  readonly emailPattern = '^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$';

  constructor(private http: HttpClient) {}

  async createAccount(
    email: string,
    username: string,
    password: string,
    invitation: string,
    number: string | null
  ) {
    username.trim();
    invitation.trim();
    const hashedPassword = await pbkdf2(email, password);
    return this.http.post(ServerRoutes.register, {
      login: email,
      name: username,
      hashed_password: hashedPassword,
      number: number !== null ? Number(number) : null,
      invitation: invitation,
    });
  }
}
