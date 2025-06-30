export interface BaseUser {
    USER_ID: number;
    USER_NAME: string;
    EMAIL_ADDRESS: string;
    IS_FIRST_LOGIN: boolean;
    PASSWORD?: string; // Only for login requests
    EMPLOYEE?: {
      EMPLOYEE_ID: number;
      FIRST_NAME: string;
      LAST_NAME: string;
      FULL_NAME?: string;
      DEPARTMENT?: string;
      POSITION?: string;
    };
    ROLE?: {
      ROLE_ID: number;
      ROLE_NAME: string;
      PERMISSIONS?: string[];
    };
  }
  
  export interface User extends BaseUser {
    token?: string;
    exp?: number;
    userId?: number;
  }
  
  export interface LoginResponse {
    token: string;
    user: BaseUser;
  }
  
  export interface DecodedToken {
    sub?: string | number;
    userId?: number;
    exp: number;
    [key: string]: any;
  }
  
  export interface RefreshTokenResponse {
    token: string;
    user?: BaseUser;
  }