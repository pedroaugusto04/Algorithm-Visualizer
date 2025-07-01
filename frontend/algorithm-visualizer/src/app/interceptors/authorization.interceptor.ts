import {
    HttpErrorResponse,
    HttpEvent,
    HttpHandler,
    HttpInterceptor,
    HttpRequest,
} from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { catchError, Observable, throwError } from "rxjs";
import { CookieService } from "ngx-cookie-service";
import { UserService } from "../services/user.service";
import { AuthService } from "../services/auth.service";
import { SwalService } from "../services/utils/swal/swal.service";

@Injectable({
    providedIn: "root",
})
export class AuthorizationInterceptor implements HttpInterceptor {
    constructor(private swalService: SwalService, private cookieService: CookieService,
        private authService: AuthService, private userService: UserService, private router: Router
    ) { }

    intercept(
        req: HttpRequest<any>,
        next: HttpHandler
    ): Observable<HttpEvent<any>> {

        if (req.url.includes("/users/login") || req.url.includes("/users/register")) {
            return next.handle(req);
        }

        const token = this.cookieService.get("token");

        let modifiedReq = req.clone({
            setHeaders: token ? { Authorization: `Bearer ${token}` } : {}
        });

        return next.handle(modifiedReq).pipe(
            catchError((error: HttpErrorResponse) => {

                if (error.status === 401 || error.status === 403) {

                    const isUserLoggedIn: boolean = this.userService.isUserLoggedIn();
                    
                    if (isUserLoggedIn){
                        //this.authService.logoutUserHome();
                        //this.swalService.errorNoButton("Your session has expired. Please log in again","");
                    }


                }
                return throwError(() => error);
            }));
    }
}