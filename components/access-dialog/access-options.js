import React from "react";

import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import DatasetLinkedOutlinedIcon from "@mui/icons-material/DatasetLinkedOutlined";

export default [
  {
    "description": "Only you and people added below can access this Project",
    "icon": (<LockOutlinedIcon />),
    "label": "Private",
    "value": "private",
  },
  {
    "description": "Anyone who has the link can access this Project",
    "icon": (<DatasetLinkedOutlinedIcon />),
    "label": "Anyone with the link",
    "value": "restricted",
  },
];
