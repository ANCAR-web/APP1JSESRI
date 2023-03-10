require([
    "esri/config",
    "esri/Map",
    "esri/views/MapView",
    "esri/layers/FeatureLayer",
    "esri/symbols/WebStyleSymbol",
    "esri/Basemap",
    "esri/rest/support/TopFeaturesQuery",
    "esri/rest/support/TopFilter"
  ], (
    esriConfig,
    Map,
    MapView,
    FeatureLayer,
    WebStyleSymbol,
    Basemap,
    TopFeaturesQuery,
    TopFilter
  )=>
  (async () => {

    esriConfig = "AAPKc0b5b552c4324dc29a90351172d2b735eM1eJrecMDQYEQZi4rnGIPsjY_Llxx1p0nXXbkHOEsxXmYiO6lqTiBkAGXsSplrm";
      
      // dark human geography basemap
      const basemap = new Basemap({
        portalItem: {
          id: "4f2e99ba65e34bb8af49733d9778fb8e"
        }
      });
      // national parks layer
      const layer = new FeatureLayer({
        url: "https://services.arcgis.com/V6ZHFr6zdgNZuVG0/arcgis/rest/services/US_National_Parks_Annual_Visitation/FeatureServer/0",
        outFields: ["*"],
        renderer: await setRenderer(),
        popupTemplate: createPopupTemplate()
      });

      const map = new Map({
        basemap,
        layers: [layer]
      });

      const view = new MapView({
        container: "viewDiv",
        map: map,
        center: [-97.75188, 37.23308],
        zoom: 3,
        padding: {
          right: 380
        }
      });

      const layerView = await view.whenLayerView(layer);

      // get UI components involved in top features query
      const orderDirectionSelection = document.getElementById(
        "orderDirectionSelection"
      );
      //agarrar el grupo de opciones de campo de la capa
      const orderByFieldSelection =document.getElementById("orderByFieldSelect");
      const clearQueryButton = document.getElementById("clear-query");
      const queryParksButton = document.getElementById("query-parks");

      // This function runs when user clicks on query parks button
      // *********************************************************
      document
        .getElementById("query-parks")
        .addEventListener("click", async () => {
          clearQueryButton.appearance = "outline";
          queryParksButton.appearance = "solid";

          // check if the user wants to select the most or least visited parks
          // in each state
          //variable que selecciona los valores de cada seleect del selectgroup
          const queryOrder = orderDirectionSelection.selectedItem.value;
          //arreglo que contiene un filtro de los valores de cada selectoption
          const orderByField = [
            `${orderByFieldSelection.selectedOption.value} ${queryOrder}`
          ];
          //console.log(orderByField);

          // TopFeatureQuery parameter for the queryTopFeatures method
          // collect user inputs to query either the most or the least
          // visited national parks in each state
          query = new TopFeaturesQuery({
            topFilter: new TopFilter({
              topCount: parseInt(topCountSelect.selectedOption.value),
              groupByFields: ["State"],
              orderByFields: orderByField
            }),
            orderByFields: orderByField,
            outFields: ["State, TOTAL, F2018, F2019, F2020, Park"],
            returnGeometry: true,
            cacheHint: false
          });
          
          const results = await layer.queryTopFeatures(query);

          document.getElementById("resultsDiv").style.display = "block";
          document.getElementById(
            "resultsHeading"
          ).innerHTML = `Results: ${results.features.length} parks`;
          document.getElementById("results").innerHTML = "";

          graphics = results.features;
          graphics.forEach((result, index) => {
            const attributes = result.attributes;
            const item = document.createElement("calcite-pick-list-item");
            item.setAttribute("label", attributes.Park);
            item.setAttribute("value", index);

            const visitorTotal = orderByFieldSelection.selectedOption.value;
            const total = `Total visitors: ${attributes[visitorTotal]}`;
            const state = `State: ${attributes.State}`;
            const description = total + "\n" + state;
            item.setAttribute("description", description);
            item.addEventListener("click", parkResultClickHandler);
            document.getElementById("results").appendChild(item);
          });

          // set query for the queryTopObjectIds.
          query.orderByFields = [""];
          const objectIds = await layer.queryTopObjectIds(query);
          layerView.filter = {
            objectIds
          };
        });

      // ***************************************************
      // this function runs when user clicks on the park
      // in the list shown on the right side of the app
      // ***************************************************
      function parkResultClickHandler(event) {
        const target = event.target;
        const resultId = target.getAttribute("value");

        // get the graphic corresponding to the clicked zip code
        const result =
          resultId && graphics && graphics[parseInt(resultId, 10)];

        if (result) {
          view.popup.open({
            features: [result],
            location: result.geometry
          });
        }
      }

      clearQueryButton.addEventListener("click", () => {
        clearQueryButton.appearance = "solid";
        queryParksButton.appearance = "outline";
        layerView.filter = null;
        view.popup.close();
        document.getElementById("resultsHeading").innerHTML = `Results`;
        document.getElementById("results").innerHTML = "";
      });

      async function setRenderer() {
        const symbol = new WebStyleSymbol({
          name: "park",
          styleName: "Esri2DPointSymbolsStyle"
        });

        const cimSymbol = await symbol.fetchCIMSymbol();
        const symbolLayer = cimSymbol.data.symbol.symbolLayers[0];
        symbolLayer.size = 16;
        cimSymbol.data.symbol.symbolLayers = [symbolLayer];

        return {
          type: "simple",
          symbol: cimSymbol
        };
      }

      function createPopupTemplate() {
        return {
          title: "{Park}",
          content: [
            {
              type: "fields",
              fieldInfos: [
                {
                  fieldName: "TOTAL",
                  label: "Total visits",
                  format: {
                    places: 0,
                    digitSeparator: true
                  }
                },
                {
                  fieldName: "F2018",
                  label: "2018",
                  format: {
                    places: 0,
                    digitSeparator: true
                  }
                },
                {
                  fieldName: "F2019",
                  label: "2019",
                  format: {
                    places: 0,
                    digitSeparator: true
                  }
                },
                {
                  fieldName: "F2020",
                  label: "2020",
                  format: {
                    places: 0,
                    digitSeparator: true
                  }
                }
              ]
            }
          ]
        };
      }
    })());