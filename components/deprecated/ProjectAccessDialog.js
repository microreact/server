import clsx from "clsx";
import PropTypes from "prop-types";
import React from "react";

import { UiDialog } from "microreact-viewer/index";

import { root as dialogClassname } from "../styles/project-dialog.module.css";
import { root as rootClassname } from "../styles/project-access-dialog.module.css";

import UiDataHook from "./UiDataHook";
import ProjectAccessLevelSection from "./ProjectAccessLevelSection";
import ProjectAccessSharingSection from "./ProjectAccessSharingSection";
import ProjectAccessLinkSection from "./ProjectAccessLinkSection";

import * as DataHooks from "../utils/data-hooks";

class ProjectAccessDialog extends React.PureComponent {

  state = {
    access: null,
  }

  render() {
    const { props } = this;

    return (
      <UiDialog
        className={clsx(rootClassname, dialogClassname)}
        onClose={props.onClose}
        isOpen
        title="Share with People"
      >
        <div className="full-content">
          <UiDataHook
            dataHook={() => DataHooks.projectAccessHook(props.projectId)}
          >
            {
              ({ data: projectAccessData }) => {
                return (
                  <React.Fragment>
                    <ProjectAccessLinkSection
                      projectAccessData={projectAccessData}
                    />

                    <ProjectAccessLevelSection
                      projectAccessData={projectAccessData}
                    />

                    <ProjectAccessSharingSection
                      projectAccessData={projectAccessData}
                    />

                  </React.Fragment>
                );
              }
            }
          </UiDataHook>
        </div>
      </UiDialog>
    );
  }

}

ProjectAccessDialog.propTypes = {
  onClose: PropTypes.func.isRequired,
  projectId: PropTypes.string.isRequired,
};

ProjectAccessDialog.defaultProps = {
};

export default ProjectAccessDialog;
