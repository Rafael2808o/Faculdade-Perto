import { createReadStream,createWriteStream } from 'node:fs';
import { once } from 'node:events';
import { parseArgs } from 'node:util';

const { values }=parseArgs({options:{input:{type:'string'},output:{type:'string'}}});
if(!values.input||!values.output){console.error('Uso: node scripts/build-centroids-from-geojson.js --input municipios.geojson --output municipios.csv');process.exit(1)}

function polygonCentroid(rings){let twiceArea=0,x=0,y=0;for(const ring of rings)for(let i=0;i<ring.length-1;i+=1){const [x1,y1]=ring[i];const [x2,y2]=ring[i+1];const cross=x1*y2-x2*y1;twiceArea+=cross;x+=(x1+x2)*cross;y+=(y1+y2)*cross}return twiceArea===0?null:{x:x/(3*twiceArea),y:y/(3*twiceArea),weight:Math.abs(twiceArea)}}
function centroid(geometry){const polygons=geometry.type==='Polygon'?[geometry.coordinates]:geometry.coordinates;const parts=polygons.map(polygonCentroid).filter(Boolean);const total=parts.reduce((sum,part)=>sum+part.weight,0);return [parts.reduce((sum,part)=>sum+part.x*part.weight,0)/total,parts.reduce((sum,part)=>sum+part.y*part.weight,0)/total]}

let json='';for await(const chunk of createReadStream(values.input,{encoding:'utf8'}))json+=chunk;
const collection=JSON.parse(json);const output=createWriteStream(values.output,{encoding:'utf8'});output.write('ibge_code,latitude,longitude\n');let count=0;
for(const feature of collection.features){const code=String(feature.properties.codarea||feature.properties.CD_MUN||'').trim();if(!code||!feature.geometry)continue;const [longitude,latitude]=centroid(feature.geometry);if(!output.write(`${code},${latitude.toFixed(7)},${longitude.toFixed(7)}\n`))await once(output,'drain');count+=1}
output.end();await once(output,'finish');console.log(`${count} centroides oficiais gravados em ${values.output}`);
