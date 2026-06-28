export interface ChurchSettings {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  denomination: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  site: string | null;
  serviceHours: string | null;
}
