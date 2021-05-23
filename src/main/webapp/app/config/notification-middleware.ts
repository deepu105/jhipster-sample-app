import { translate } from 'react-jhipster';
import { toast } from 'react-toastify';

const addErrorAlert = (message, key?, data?) => {
  key = key ? key : message;
  toast.error(translate(key, data));
};

export default () => next => action => {
  const { error, payload, meta } = action;
  /**
   *
   * The notification middleware serves to add success and error notifications
   */
  if (meta && meta.successMessage) {
    toast.success(meta.successMessage);
  } else if (payload && payload.headers) {
    const headers = payload.headers;
    let alert: string | null = null;
    let alertParams: string | null = null;
    Object.entries<string>(headers).forEach(([k, v]) => {
      if (k.toLowerCase().endsWith('app-alert')) {
        alert = v;
      } else if (k.toLowerCase().endsWith('app-params')) {
        alertParams = decodeURIComponent(v.replace(/\+/g, ' '));
      }
    });
    if (alert) {
      const alertParam = alertParams;
      toast.success(translate(alert, { param: alertParam }));
    }
  }

  if (meta && meta.errorMessage) {
    toast.error(meta.errorMessage);
  } else if (error && payload && payload.isAxiosError) {
    if (payload.response) {
      const response = payload.response;
      const data = response.data;
      if (
        !(
          response.status === 401 &&
          (error.message === '' || (data && data.path && (data.path.includes('/api/account') || data.path.includes('/api/authenticate'))))
        )
      ) {
        let i;
        switch (response.status) {
          // connection refused, server not reachable
          case 0:
            addErrorAlert('Server not reachable', 'error.server.not.reachable');
            break;

          case 400: {
            const headers = Object.entries<string>(response.headers);
            let errorHeader: string | null = null;
            let entityKey: string | null = null;
            headers.forEach(([k, v]) => {
              if (k.toLowerCase().endsWith('app-error')) {
                errorHeader = v;
              } else if (k.toLowerCase().endsWith('app-params')) {
                entityKey = v;
              }
            });
            if (errorHeader) {
              const entityName = translate('global.menu.entities.' + entityKey);
              addErrorAlert(errorHeader, errorHeader, { entityName });
            } else if (data !== '' && data.fieldErrors) {
              const fieldErrors = data.fieldErrors;
              for (i = 0; i < fieldErrors.length; i++) {
                const fieldError = fieldErrors[i];
                if (['Min', 'Max', 'DecimalMin', 'DecimalMax'].includes(fieldError.message)) {
                  fieldError.message = 'Size';
                }
                // convert 'something[14].other[4].id' to 'something[].other[].id' so translations can be written to it
                const convertedField = fieldError.field.replace(/\[\d*\]/g, '[]');
                const fieldName = translate(`jhtestApp.${fieldError.objectName}.${convertedField}`);
                addErrorAlert(`Error on field "${fieldName}"`, `error.${fieldError.message}`, { fieldName });
              }
            } else if (data !== '' && data.message) {
              addErrorAlert(data.message, data.message, data.params);
            } else {
              addErrorAlert(data);
            }
            break;
          }
          case 404:
            addErrorAlert('Not found', 'error.url.not.found');
            break;

          default:
            if (data !== '' && data.message) {
              addErrorAlert(data.message);
            } else {
              addErrorAlert(data);
            }
        }
      }
    } else if (payload.config && payload.config.url === 'api/account' && payload.config.method === 'get') {
      /* eslint-disable no-console */
      console.log('Authentication Error: Trying to access url api/account with GET.');
    } else if (payload.message) {
      toast.error(error.message);
    }
  } else if (error) {
    toast.error('Unknown error!');
  }

  return next(action);
};
