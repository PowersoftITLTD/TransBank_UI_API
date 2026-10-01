import { inject, Injectable } from '@angular/core';
import { AccountGroup, BankAccount } from '../models/bank-account.model';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from './config.service';

const endpointPaths = {
  secureAPI: '/v1',
  isDashboard:'/Dashboard'
};

@Injectable({ providedIn: 'root' })
export class BankDataService {

   private http = inject(HttpClient);
  private config = inject(ConfigService);
  private readonly data: AccountGroup[] = [];

  getAccounts(): BankAccount[] { return this.data.flatMap(group => group.accounts); }
  getGroups(): AccountGroup[] { return this.data; }

  getSecureAPI(
    url:string,
    isAuth?:boolean,
    isDashboard?:boolean
  ): Observable<any>{


    if (isAuth) {
      url = endpointPaths.secureAPI + '/' + url;
    }

    if(isDashboard){
      url = endpointPaths.isDashboard + '/' + url;      
    }

    const url_path = `${this.config.apiBaseUrl}${url}`

    return this.http.get(url_path);
  }

  postSecureAPI(
    url: string,
    payload: any,        // ← the body to send
    isAuth?: boolean,
    isDashboard?:boolean 

  ): Observable<any> {
    // Build endpoint
    if (isAuth) {
      url = endpointPaths.secureAPI + '/' + url;
    }

    if(isDashboard){
      url = endpointPaths.isDashboard + '/' + url;
    }

    // Build full URL using config.json
    const url_path = `${this.config.apiBaseUrl}${url}`;

    // Make HTTP POST request
    return this.http.post(url_path, payload);
  }
}
