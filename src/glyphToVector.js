import { getQuadraticBezierCurve } from "./spatialBezierCurve";

/**
 * 
 * @param {Array<[Array]>} glyphPathArray
 * @param {Array} startPoint
 * @param {Number} smoothness
 * @returns {JSON}
 */

export function glyphToPolygon(glyphPathArray, startPoint, smoothness){

    let geoJSON= {

        "type":"FeatureCollection",
        "name":"polygonFeatures",
        "crs":{
            "type": "name",
            "properties": {
              "name": "EPSG:3857"
            }
          }
          ,
        "features": [
            
        ]
    }

    for (let i=0;i<glyphPathArray.length;i++){

        let rings=toSpatialCoordinates(glyphPathArray[i],startPoint,smoothness); //converting glyphs to spatial coordinates

        if (glyphPathArray[i].commands.length===0){ //Managing spaces in text
            startPoint[0]= startPoint[0]+((glyphPathArray[i-1].getBoundingBox()['x2'])-(glyphPathArray[i-1].getBoundingBox()['x1']));
        }

        startPoint[0]= startPoint[0]+glyphPathArray[i].getBoundingBox()['x2']; //Spacing between two characters
        geoJSON["features"].push(
            {
                "type":"Feature",
                "geometry":{
                    "type":"Polygon",
                    "coordinates":rings,
                },
                "id":i.toString(),
            },)

    }

    return geoJSON;

}

/**
 * 
 * @param {Array<[Array,Array]>} glyphPath 
 * @param {Array<[number,number]>} startPoint 
 * @returns {Array<[Array,Array]>}
 */

function toSpatialCoordinates(glyphPath,startPoint,smoothness){
    let x0=startPoint[0];
    let y0=startPoint[1];

    let rings= []; //Rings of the polygon (Array of ring)
    let ring= []; //Ring of the polygon (Outer/Inner)

    let glyphCoords= glyphPath.commands;
    let glyphCoordsLength= glyphCoords.length
    glyphCoords.forEach((el,idx)=>{

        //First part of glyph will be outer ring

        if (el.type==='M'){
            let coords= [x0+el.x, y0-el.y];
            ring.push(coords);

        }else if (el.type==='L'){
            let coords= [x0+el.x, y0-el.y];
            ring.push(coords);

        }else if (el.type==='Q'){

            //Take the control points, start and end coords, calculate 't'. Then use the t and start and end coords to generate curve

            let p1= [x0+el.x1, y0-el.y1]; //control point
            let p0= ring[ring.length-1]; //start point
            let p2= [x0+el.x, y0-el.y] //end point

            let Q= getQuadraticBezierCurve(p0,p2, p1,smoothness);
            Q.forEach(el=>{
                ring.push(el);
            })
            
            let coords= [x0+el.x, y0-el.y];
            ring.push(coords);
        }else if (el.type==='Z'){
            rings.push(ring);
            ring=[];
        }
        else{
            console.log('Invalid glyph');
        }
    });

    return rings;

}