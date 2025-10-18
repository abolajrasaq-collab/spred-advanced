import React, { useState, useEffect } from 'react';
import ImprovedHeader from '../components/ImprovedHeader/ImprovedHeader';

const AppBar = ({ userInfo }: { userInfo?: any }) => {
  return (
    <ImprovedHeader
      userInfo={userInfo}
      showSearch={true}
      showNotifications={true}
    />
  );
};

export default AppBar;
