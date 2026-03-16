export interface AssetDescriptionM {
  id?: any;
  assetName: string;
  assetCode?: string;
  qty?: string;
  assetTypeId: number;
  vendorName?: string;
  purInvNO?: string;
  purDate: Date;
  purPrice: number;
  depCalDate: Date;
  deprePercentage: number;
  location?: string;
  warrEndDate?: Date;
  fileLink?: string;
  assetStatus: number;
  remarks?: string;
  postBy?: string;
  others1?: string;
  others2?: string;
  others3?: string;
  
  // Not mapped properties (calculated)
  depThisMonth?: string;
  totalDepValue?: number;
  wdv?: number;
  
  // For display purposes
  assetTypeName?: string; // To show asset type name in list
}

// Asset Status Enum (adjust values based on your needs)
export enum AssetStatus {
  Active = 1,
  Inactive = 2,
  Disposed = 3,
  UnderMaintenance = 4
}