interface BusArriveInfo {
  resultCode: string;
  resultMsg: string;
  numOfRows: string;
  pageNo: string;
  totalCount: string;
  nodeid: string;
  nodenm: string;
  routeid: string;
  routeno: string;
  routetp: string;
  arrprevstationcnt: string;
  vehicletp: string;
  arrtime: string;
}

interface BusRouteInfo {
  resultCode: string;
  resultMsg: string;
  routeid: string;
  routeno: string;
  routetp: string;
  endnodenm: string;
  startnodenm: string;
  intervaltime: string;
  intervalsattime: string;
  intervalsuntime: string;
}

interface BusStationInfo {
  resultCode: string;
  resultMsg: string;
  numOfRows: string;
  pageNo: string;
  totalCount: string;
  gpslati: string;
  gpslong: string;
  nodeid: string;
  nodenm: string;
  citycode: string;
}

export { BusArriveInfo, BusRouteInfo, BusStationInfo };
