import Map, { Layer, LineLayer, MapLayerMouseEvent, Source } from 'react-map-gl';
import * as arcgisRest from '@esri/arcgis-rest-request';
import { addFeatures, applyEdits, queryFeatures } from '@esri/arcgis-rest-feature-service';
import { featureCollection, lineString } from '@turf/helpers';

import './App.css';
import { useEffect, useState } from 'react';

type TLngLatArray = [number, number];

const measureLayersId = {
  measurePoints: 'dot-measure-points',
  measureLines: 'dot-measure-lines',
};

export const sourceId = 'measure-source';

const measureLineLayerConfig: LineLayer = {
  id: measureLayersId.measureLines,
  source: sourceId,
  type: 'line',
  layout: {
    'line-cap': 'round',
    'line-join': 'round',
  },
  paint: {
    'line-color': '#DAB700',
    'line-width': 6,
  },
  filter: ['in', '$type', 'LineString'],
};

function App() {
  const [lrs, setLrs] = useState<any>(null);
  const [points, setPoints] = useState<TLngLatArray[]>([]);
  const accessToken = 'AAPTxy8BH1VEsoebNVZXo8HurOyo_wDS8kAWYSnSnovXaXZJTbols2LxyQPqxagWNbrgVR27_Nf3YiX3jj1DpgmnvIG042g4vAyVD59kEEgEXjCmUTEEdaBUKWe0hv84YNGIJRVa5RIAA4ceU7AZ6kdcZDaGwcMONx5MoWFzmU5KdZWkTm0ZmJSWTVHkgKWy2Q7O9ehZ8AJtAGF5SKfl5IqTuIihUYbXwx8nuuFeRqzynTF1geDrbtEpykzp2AGzoGGNAT1_VUDtOVDr';
  const authentication = arcgisRest.ApiKeyManager.fromKey(accessToken);

  const mapClickHandler = (event: MapLayerMouseEvent): void => {
    if (event.features?.length && event?.features[0]?.layer?.id === measureLayersId.measurePoints) {
      const elementIndex = event.features[0] ? event.features[0].properties?.id : null;
      setPoints(points.filter((_, index) => index !== elementIndex));
      return;
    }

    setPoints([...points, [event.lngLat.lng, event.lngLat.lat]]);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await queryFeatures({
          url: 'https://services3.arcgis.com/2li9YMIilAuPopST/arcgis/rest/services/DEL_LRS/FeatureServer/0',
          f: 'geojson',
          authentication,
        });
        if (response && 'features' in response) {
          console.log(featureCollection(response?.features as any));
          setLrs(featureCollection(response?.features as any));
        }
      } catch (error) {
        console.log(error);
      }
    };

    fetchData();
  }, []);

  const save = async () => {
    try {
      const response = await applyEdits({
        authentication,
        url: "https://services3.arcgis.com/2li9YMIilAuPopST/arcgis/rest/services/DEL_LRS/FeatureServer/0",
        adds: [{
          geometry: {
            paths: [points],
          },
          attributes: {
            "ROUTEID": "2002009",
            "UPDT": 1708989618000,
            "NEW_ROUTEID": "KC-200257-F",
            "BEG_MP": 0,
            "END_MP": 0.24,
            "LRS_UPDT_DATE": 1550223419000,
            "OBJECTID": 1,
            "GEOM_LEN": 0,
            "Shape__Length": 501.5824792226916
          }
        }]
      });
      console.log(response);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      <button onClick={save} disabled={points.length < 2}>Save new road</button>
      <Map
        mapboxAccessToken="pk.eyJ1IjoidGFiYXNpcyIsImEiOiJjbG81Zno0N3AwNzZjMm5vNGY4dXU3MHhiIn0.UEW5KCtI-ww84fNgreY8Sg"
        initialViewState={{
          longitude: -75.532346,
          latitude: 39.083797,
          zoom: 8,
        }}
        style={{ width: '100%', height: '80vh' }}
        mapStyle="mapbox://styles/mapbox/streets-v9"
        onClick={mapClickHandler}
      >
        <Source type="geojson" data={lrs}>
          <Layer type="line" paint={{ 'line-color': '#FF0000', 'line-width': 2 }} />
        </Source>

        <Source
          id={sourceId}
          type="geojson"
          data={points.length >= 2 ? lineString(points, { id: 'measure-line' }) : featureCollection([])}
        >
          {}
          <Layer {...measureLineLayerConfig} />
        </Source>
      </Map>
    </>
  );
}

export default App;
