interface IAddressResponse {
  meta: IMeta;
  documents: IAddressDocuments[];
}

interface IMeta {
  total_count: number;
  pageable_count: number;
  is_end: boolean;
}

interface IAddressDocuments {
  address_name: string;
  address_type: string;
  x: string;
  y: string;
  address: IAddress;
  road_address: IRoadAddress;
}

interface IAddress {
  address_name: string;
  region_1depth_name: string;
  region_2depth_name: string;
  region_3depth_name: string;
  region_3depth_h_name: string;
  h_code: string;
  b_code: string;
  mountain_yn: string;
  main_address_no: string;
  sub_address_no: string;
  zip_code: string;
  x: string;
  y: string;
}

interface IRoadAddress {
  address_name: string;
  region_1depth_name: string;
  region_2depth_name: string;
  region_3depth_name: string;
  road_name: string;
  underground_yn: string;
  main_building_no: string;
  sub_building_no: string;
  building_name: string;
  zone_no: string;
  x: string;
  y: string;
}
