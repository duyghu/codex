import { ApplicationInsights } from '@microsoft/applicationinsights-web';

const connectionString = process.env.REACT_APP_APPLICATIONINSIGHTS_CONNECTION_STRING;

if (connectionString) {
  const appInsights = new ApplicationInsights({
    config: {
      connectionString,
      enableAutoRouteTracking: true,
      disableFetchTracking: false,
      disableAjaxTracking: false,
    },
  });

  appInsights.loadAppInsights();
  appInsights.trackPageView();
}
