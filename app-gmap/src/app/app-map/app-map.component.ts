import { Component, ElementRef, HostListener, NgZone, OnInit, ViewChild } from '@angular/core';
import { MapsAPILoader, GoogleMapsAPIWrapper, AgmMap } from "@agm/core";
import { } from 'googlemaps';
import * as _ from 'lodash';

@Component({
  selector: 'app-app-map',
  templateUrl: './app-map.component.html',
  styleUrls: [`./app-map.component.scss`]
})
export class AppMapComponent {
  map: any;
//start with this coordinates
  LATITUDE = 46.5790435;
  LONGITUDE = 33.2175265;

  //default
  zoom = 18;

  WIDTH_MAP = 7000; //width map
  HIEGTH_MAP = 4000; //height map
  //markers of types {  id, latitude, longitude, title? }
  gpsMarkers: any = [];
  
  isOpen = this.gpsMarkers.length > 0; //is open titles if has title - agm-info-window
  rectangleData: any = null; //calculate rectangles min max long and min max lat

  distansAB = '';//distans rectagle ABDC and side AB and AC
  distansAC = '';//distans rectagle ABDC and side AB and AC

  center = ''; 
  screenHeight: number= 0;
  screenWidth: number=0;
  styleCss = `width: ${this.WIDTH_MAP}px; height: ${this.HIEGTH_MAP}px;`;
  

  constructor(private zone: NgZone) {
  }
  
  ngOnChanges() {
  }

  public mapReady(map: any) {
    this.map = map;
  }

  fileContent: string = '';

  public onFileLoad($event: any): void {
    let fileList: FileList = $event.target.files;
    let file = fileList[0];
    let fileReader: FileReader = new FileReader();
    let self = this;
    fileReader.onloadend = function (x) {
      if (self?.fileContent && fileReader?.result)
        console.log('fileReader?.result', fileReader?.result)
      self.processFileData(fileReader?.result || '')
      //self.fileContent = fileReader?.result;
    }
    fileReader.readAsText(file);
  }

  public onChangeWidth($event: any): void {
    let width = $event.target.value || '0';
    this.WIDTH_MAP = width;
    this.styleCss = `width: ${this.WIDTH_MAP}px; height: ${this.HIEGTH_MAP}px;`;
  }
  public onChangeHeigth($event: any): void {
    let heigth = $event.target.value || '0';
    this.HIEGTH_MAP = heigth;
    this.styleCss = `width: ${this.WIDTH_MAP}px; height: ${this.HIEGTH_MAP}px;`;
  }

  processFileData(rres: any) {
    let res = (rres as string).replace('\r', '').split('\n')
    const gpsData = res.reduce((previousValue: Array<any>, currentValue: string) => {
      const data = currentValue.split(',');
      if (data.length > 2) {
        previousValue.push({
          id: data[0],
          latitude: Number(((data[1]) || '').trim()),
          longitude: Number((data[2] || '').trim()),
          title: data[3] || ''
        })
      }
      return previousValue;
    }, []);

    this.calculateMinMax(gpsData);//Calculate longitudes - min max value and latitudes- min max value


    this.setWidthHeigthForInfo(); //display Width an height in km on settings
    this.gpsMarkers = gpsData; //set data
  }


  calculateMinMax(gpsMarkers: any = []) {
    let longitudes = gpsMarkers.map((i: { longitude: number }) => i.longitude);
    let latitudes = gpsMarkers.map((i: { latitude: number }) => i.latitude);

    latitudes.sort();
    longitudes.sort();

    let longitudemin = longitudes[0];
    let longitudemax = longitudes[longitudes.length - 1];
    let latitudemin = latitudes[0];
    let latitudemax = latitudes[longitudes.length - 1];

    //this.LONGITUDE = (longitudemin + longitudemax) / 2;
    //this.LATITUDE = (latitudemin + latitudemax) / 2;

    this.center = `LON: ${(longitudemin + longitudemax) / 2}, LAT: ${(latitudemin + latitudemax) / 2}`;
    
    const minMax = {
      longitude: {
        min: longitudemin,
        max: longitudemax
      },
      latitude: {
        min: latitudemin,
        max: latitudemax
      }
    }
    this.rectangleData = this.createRectangle(minMax);
    debugger;
  }

  createRectangle(minMax: { longitude: { min: number, max: number }, latitude: { min: number, max: number } }) {
    return ({
      sideAB: {
        A: {
          longitude: minMax.longitude.min,
          latitude: minMax.latitude.min
        },
        B: {
          longitude: minMax.longitude.max,
          latitude: minMax.latitude.min
        },
        dist: _.round(this.calculateTheDistance(
          {
            latitud: minMax.latitude.min,
            longitud: minMax.longitude.max
          },
          {
            latitud: minMax.latitude.min,
            longitud: minMax.longitude.min
          }), 2)
      },
      sideAC: {
        A: {
          longitude: minMax.longitude.min,
          latitude: minMax.latitude.min
        },
        C: {
          longitude: minMax.longitude.min,
          latitude: minMax.latitude.max
        },
        dist: _.round(this.calculateTheDistance(
          {
            latitud: minMax.latitude.min,
            longitud: minMax.longitude.min
          },
          {
            latitud: minMax.latitude.max,
            longitud: minMax.longitude.min
          }), 2)
      }
    });
  };

  setWidthHeigthForInfo() {
    this.distansAB = this.rectangleData?.sideAB?.dist || '';
    this.distansAC = this.rectangleData?.sideAC?.dist || '';
  }

  calculateTheDistance(first: { longitud: number, latitud: number }, second: { longitud: number, latitud: number }) {
    const EARTH_RADIUS = 6372795;

    const lat1 = first.latitud * Math.PI / 180;
    const lat2 = second.latitud * Math.PI / 180;
    const long1 = first.longitud * Math.PI / 180;
    const long2 = second.longitud * Math.PI / 180;

    const cosLat1 = Math.cos(lat1);
    const cosLat2 = Math.cos(lat2);
    const sinLat1 = Math.sin(lat1);
    const sinLat2 = Math.sin(lat2);
    const delta = long2 - long1;
    const cdelta = Math.cos(delta);
    const sdelta = Math.sin(delta);

    const y = Math.sqrt(Math.pow(cosLat2 * sdelta, 2) + Math.pow(cosLat1 * sinLat2 - sinLat1 * cosLat2 * cdelta, 2));
    const x = sinLat1 * sinLat2 + cosLat1 * cosLat2 * cdelta;

    const ad = Math.atan2(y, x);
    const dist = ad * EARTH_RADIUS;
    return dist / 1000;
  };
}
