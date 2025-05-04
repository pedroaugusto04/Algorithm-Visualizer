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
import { SnackBarService } from "../services/utils/snack-bar.service";
import { CookieService } from "ngx-cookie-service";

@Injectable({
    providedIn: "root",
})
export class AuthorizationInterceptor implements HttpInterceptor {
    constructor(private router: Router, private snackBarService: SnackBarService, private cookieService: CookieService) { }

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
                    const currentRoute = this.router.url;

                    if (currentRoute.includes('/authentication/register')) {
                        this.router.navigate(['/authentication/register']);
                    } else {
                        this.router.navigate(['/authentication/login']);
                    }

                    this.snackBarService.showSnackBarError("Your session has expired. Please log in again to continue.", 5000)
                }
                return throwError(() => error);
            }));
    }
}