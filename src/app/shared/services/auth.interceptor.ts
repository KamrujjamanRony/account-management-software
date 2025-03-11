import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    // ✅ Retrieve and parse the stored data
    const localData = localStorage.getItem('AdminInfo');
    const parsedData = localData ? JSON.parse(localData) : null;
    // ✅ Check if there is a token in the retrieved data
    console.log("Token from parsed data:", parsedData?.token);

    if (parsedData?.token) {
        req = req.clone({
            setHeaders: { Authorization: `Bearer ${parsedData.token}` }
        });
        // ✅ If a token is found, add it to the request headers
        console.log("Request with Auth Header:", req);
    }

    return next(req);
};
