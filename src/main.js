import '../styles/style.css';
import Map from 'ol/Map.js';
import {XYZ,OSM} from 'ol/source';
import TileLayer from 'ol/layer/Tile.js';
import View from 'ol/View.js';
import 'ol/ol.css';
import { transform } from 'ol/proj';
import { textToGeoJSON } from "./index.js";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import GeoJSON from 'ol/format/GeoJSON.js';
import { Style, Fill, Stroke } from 'ol/style';


let convertBtn= document.getElementById('convertBtn');
let downloadBtn= document.getElementById('downloadBtn');
let clearBtn= document.getElementById('clearBtn');
let textBox= document.getElementById('textBox');
let anchorBox= document.getElementById('anchorPoint');
anchorBox.value='78.0,30.0'
let sizeBox= document.getElementById('sizeBox');
sizeBox.value='100';
let smoothSlider= document.getElementById('smoothSlider');
smoothSlider.value='6';
let mapType= document.getElementById('mapType');

console.log('Hi from fontToGeoJSON');
let coordinates;
let coordinatesepsg3857;
let map;
let downloadFile;
let vectorFilePresent=false;
let geoJSONFile;

let sourceMap={
  '1': new TileLayer({
        source: new OSM(),
        }),
  '2': new TileLayer({
        source: new XYZ({
          url: 'https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/MapServer/tile/{z}/{y}/{x}',
        }),
      })
}

function loadMap(src){

    coordinates = [78.0,30.0];
    coordinatesepsg3857 = transform(coordinates, 'EPSG:4326', 'EPSG:3857');

    map = new Map({
        target: 'map',
        layers: [
          src
        ],
        view: new View({
          center: coordinatesepsg3857,
          zoom: 17,
        }),
      });
}
 loadMap(sourceMap['1']);



//UI EVENTS.....................................................................

 mapType.addEventListener('change',(c)=>{
  map.getLayers().forEach((l)=>{
    map.removeLayer(l);
  });
  map.addLayer(sourceMap[mapType.value]);
});



convertBtn.addEventListener('click',async ()=>{

  let text= textBox.value;
  if (text.length===0){
    alert('Enter Text first');
  }
  let textSize= sizeBox.value;
  let smoothness= smoothSlider.value;
  let anchorPointRaw= anchorBox.value;
  let anchorPoint84= anchorPointRaw.split(',');
  if (anchorPoint84.length!=2){
    alert('Invalid Coordinates format');
  }
  let anchorPoint3857= transform(anchorPoint84,'EPSG:4326', 'EPSG:3857');

  //MAIN PART

  await textToGeoJSON(text, './fonts/Roboto/Roboto-Bold.ttf', anchorPoint3857,{textSize:Number(textSize.trim()),smoothness:Number(smoothness.trim())}).then(geojson=>{
    console.log(geojson);
    let olVectorLayer= createVectorLayer(geojson);
    map.addLayer(olVectorLayer);
    geoJSONFile=geojson;
    vectorFilePresent=true;
    map.getView().setCenter(anchorPoint3857);
    map.getView().setZoom(17);

});

    

});

function download(file, text){
    var element = document.createElement('a');
                  element.setAttribute('href',
                  'data:application/json;charset=utf-8, '
                  + encodeURIComponent(text));
                  element.setAttribute('download', file);
                  document.body.appendChild(element);
                  element.click();
   
                  document.body.removeChild(element);
  }

downloadBtn.addEventListener('click',e=>{

    if (vectorFilePresent===true){
        let text= JSON.stringify(geoJSONFile);
        var filename = "text.geojson";
    
        download(filename, text);

    }else{
        alert('Generate GeoJSON first');
    }

});

clearBtn.addEventListener('click',e=>{
  location.reload();
});


//Vector layer generation and styling for openlayers...........................................

function createVectorLayer(data){

  const vectorStyle = new Style({
    fill: new Fill({
        color: 'rgba(237, 114, 167, 1)'
    }),
    stroke: new Stroke({
        color: '#000000',
        width: 2
    })
  });

    const vectorSource= new VectorSource({
        features:new GeoJSON({dataProjection:'EPSG:3857'}).readFeatures(data),
      });
  
    let vectorLayer= new VectorLayer({
      source:vectorSource,
      style:vectorStyle
    });

    return vectorLayer;

}







