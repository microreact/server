import React from "react";
import { actions, store as ViewerStore } from "microreact-viewer/index";

import PropTypes from "prop-types";

import UiLoadingSpinner from "./UiLoadingSpinner";
import ProjectViewer from "./ProjectViewer.react";
import OldProjectNotification from "./OldProjectNotification";
import ApiError from "./ApiError.react";

import * as ApiClient from "../utils/api-client";
import publicRuntimeConfig from "../utils/public-runtime-config";

// function pushQueryString(qs) {
//   if (history.pushState) {
//     const path = `${window.location.protocol}//${window.location.host}${window.location.pathname}?${qs}`;
//     window.history.pushState({ path }, "", path);
//   }
// }

// function updateQuery(query) {
//   const qs = queryString.parse(location.search);
//   const nextString = queryString.stringify({
//     ...qs,
//     ...query,
//   });
//   pushQueryString(nextString);
// }

class ProjectPage extends React.Component {

  state = {
    error: null,
    projectProps: null,
  };

  componentDidMount() {
    ApiClient.getProjectJson(this.props.projectSlug)
      .then((projectJson) => {
        projectJson.config = {
          mapboxApiAccessToken: publicRuntimeConfig.mapboxApiAccessToken,
        };
        if (this.props.query) {
          projectJson.query = this.props.query;
        }
        ViewerStore.dispatch(actions.load(projectJson));
        return projectJson._;
      })
      .then(
        (projectProps) => {
          this.setState({ projectProps });
        }
      )
      .catch(
        (errorResponse) => {
          console.error("error while loading project json", errorResponse);
          this.setState({ errorResponse });
        }
      );
  }

  componentDidUpdate(prevProps) {
    if (prevProps?.query !== this.props?.query && this.props?.query) {
      ViewerStore.dispatch(actions.query(this.props?.query));
    }
  }

  componentWillUnmount() { // eslint-disable-line class-methods-use-this
    ViewerStore.dispatch(actions.unload());
  }

  render() {
    const { props, state } = this;

    if (state.errorResponse) {
      return (
        <ApiError {...state.errorResponse} />
      );
    }

    if (state.projectProps) {
      return (
        <React.Fragment>
          {
            (state.projectProps?.version === 1) && (
              <OldProjectNotification
                projectSlug={props.projectSlug}
              />
            )
          }
          <ProjectViewer
            key={state.projectProps.id}
            projectProps={state.projectProps}
          />
        </React.Fragment>
      );
    }

    return (
      <UiLoadingSpinner>
        Loading Project
      </UiLoadingSpinner>
    );
  }
}

ProjectPage.displayName = "ProjectPage";

ProjectPage.propTypes = {
  projectSlug: PropTypes.string,
  query: PropTypes.object,
};

export default ProjectPage;
