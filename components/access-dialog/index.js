import React from "react";
import PropTypes from "prop-types";

import ShareDialog from "cgps-stdlib/ui/share-dialog/index.js";

import { projectAccessHook, userShareEmailsHook } from "../../utils/data-hooks.js";

import {
  addShareAccess,
  removeShareAccess,
  updateProjectAccess,
  updateShareAccess,
  updateProjectAlias,
} from "../../utils/api-client.js";

import config from "../../utils/public-runtime-config.js";

import accessOptions from "./access-options.js";
import shareRoles from "./share-roles.js";

function AccessDialog(props) {
  return (
    <ShareDialog
      accessLabel="General Access"
      accessOptions={accessOptions}
      dataHook={() => projectAccessHook(props.projectId)}
      defaultAlias={props.projectId}
      aliasPrefix={`${config.baseUrl}project/`}
      hasAlias
      linkLabel="Project Link"
      onAccessChange={(access) => updateProjectAccess(props.projectId, access)}
      onAliasChange={(alias) => updateProjectAlias(props.projectId, alias)}
      onClose={props.onClose}
      onRevokeInvitation={(email, kind) => removeShareAccess(props.projectId, email, kind)}
      onSendInvitation={(emails, role) => addShareAccess(props.projectId, emails, role)}
      onShareRoleChange={(email, role) => updateShareAccess(props.projectId, email, role)}
      shareEmailsDataHook={userShareEmailsHook}
      shareRoles={shareRoles}
    />
  );
}

AccessDialog.displayName = "AccessDialog";

AccessDialog.propTypes = {
  onClose: PropTypes.func,
  projectId: PropTypes.string.isRequired,
};

export default AccessDialog;
