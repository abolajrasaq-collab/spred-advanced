import {
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  View,
  useColorScheme,
  StatusBar,
  TextInput,
  // Clipboard,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import CustomButton from '../../components/CustomButton/CustomButton';
import { Modalize } from 'react-native-modalize';
import { useEffect, useRef, useState } from 'react';
import { getDataJson } from '../../helpers/api/Asyncstorage';
import axios from 'axios';
import { api } from '../../helpers/api/api';

const LeftIcon = () => (
  <MaterialIcons name="arrow-back" size={18} color="white" />
);

const DepositScreen = () => {
  const navigation = useNavigation();
  const modalizeRef = useRef<Modalize>(null);
  const [walletDetails, setWalletDetails] = useState({});
  const [virtualAcctDetails, setVirtualAcctDetails] = useState({});
  const [getBalnace, setGetBalance] = useState<{
    currency?: string;
    available_balance?: number;
    ledger_balance?: number;
  }>({ currency: '', available_balance: 0, ledger_balance: 0 });
  const [loadingBalance, setLoadingBalance] = useState(false);

  const [user, setUser] = useState({});
  const token = user?.token;
  const id = user?.id;
  // DISABLED FOR PERFORMANCE
  // console.log('its here wallet', id, user?.token);
  useEffect(() => {
    getStoredUserData();
  }, []);

  // Fetch wallet details after user data is loaded
  useEffect(() => {
    if (user?.id && user?.token) {
      get();
    }
  }, [user?.id, user?.token]);

  // Fetch virtual account and balance after wallet details are loaded
  useEffect(() => {
    if (walletDetails?.account_Reference) {
      fetchVirtualaccount();
      fetchAccountBalance();
    }
  }, [walletDetails?.account_Reference]);

  const onRefresh = async () => {
    // DISABLED FOR PERFORMANCE
    // console.log('🔄 Refreshing deposit screen...');
    setLoadingBalance(true);

    try {
      // Step 1: Get user data
      await getStoredUserData();

      // Step 2: Get wallet details (wait for completion)
      if (user?.id && user?.token) {
        await get();
      }

      // Step 3: Get virtual account and balance (these will be triggered by useEffect)
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Error during refresh:', error);
    } finally {
      setLoadingBalance(false);
    }
  };
  const getStoredUserData = async () => {
    const gotten = await getDataJson('User');
    // DISABLED FOR PERFORMANCE
    // console.log('This is the user details', gotten);
    setUser(gotten);
  };

  const config = {
    headers: {
      mobileAppByPassIVAndKey:
        'a0092a148a0d69715268df9f5bb63b24fca27d344f54df9b',
      username: 'SpredMediaAdmin',
      password: 'SpredMediaLoveSpreding@2023',
      Authorization: `Bearer ${token}`, // Add the Authorization header with the token
    },
  };
  // Function to attempt wallet initialization
  const initializeWallet = async () => {
    // DISABLED FOR PERFORMANCE
    // console.log('🔧 Attempting to initialize wallet for user:', id);
    try {
      // Try different potential wallet creation endpoints
      const possibleEndpoints = [
        `${
          api.baseURL || 'https://www.spred.cc/api'
        }/Payment/Wallet/create-wallet`,
        `${
          api.baseURL || 'https://www.spred.cc/api'
        }/Payment/Wallet/initialize-wallet`,
        `${
          api.baseURL || 'https://www.spred.cc/api'
        }/Payment/Enquiry/create-wallet-byuserid`,
      ];

      for (const endpoint of possibleEndpoints) {
        try {
          // DISABLED FOR PERFORMANCE
          // console.log('🔧 Trying endpoint:', endpoint);
          const response = await axios.post(endpoint, { userId: id }, config);
          // DISABLED FOR PERFORMANCE
          // console.log('✅ Wallet initialization successful:', response?.data);
          return true;
        } catch (err) {
          // DISABLED FOR PERFORMANCE
          // console.log('❌ Failed endpoint:', endpoint, err?.response?.status);
        }
      }

      return false;
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Wallet initialization failed:', error);
      return false;
    }
  };

  const get = async () => {
    // DISABLED FOR PERFORMANCE
    // console.log('🏦 Fetching wallet details for user ID:', id);
    // DISABLED FOR PERFORMANCE
    // console.log('🏦 API URL:', `${api.getWalletDetails}/${id}`);
    try {
      let response = await axios.get(`${api.getWalletDetails}/${id}`, config);
      // DISABLED FOR PERFORMANCE
      // console.log('🏦 Wallet details response:', response?.data);
      setWalletDetails(response?.data?.data);
      // DISABLED FOR PERFORMANCE
      // console.log('✅ Wallet details loaded successfully');
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Wallet details error:', error?.response?.data);
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Wallet details error status:', error?.response?.status);

      // Handle specific error cases
      if (
        error?.response?.status === 400 &&
        error?.response?.data?.message?.includes('customer doesnt exist')
      ) {
        // DISABLED FOR PERFORMANCE
        // console.log(
        //   '...',
        // );

        // Try to initialize the wallet
        const initialized = await initializeWallet();
        if (initialized) {
          // If initialization successful, try fetching wallet details again
          // DISABLED FOR PERFORMANCE
          // console.log(
          //   '...',
          // );
          try {
            let retryResponse = await axios.get(
              `${api.getWalletDetails}/${id}`,
              config,
            );
            setWalletDetails(retryResponse?.data?.data);
            // DISABLED FOR PERFORMANCE
            // console.log(
            //   '...',
            // );
          } catch (retryError) {
            // DISABLED FOR PERFORMANCE
            // console.log(
            //   '❌ Still failed after initialization:',
            //   retryError?.response?.data,
            // );
            setWalletDetails(null);
          }
        } else {
          setWalletDetails(null); // Explicitly set to null to show error state
        }
      }
    }
  };
  const fetchVirtualaccount = async () => {
    // DISABLED FOR PERFORMANCE
    // console.log(
    //   '💳 Fetching virtual account for reference:',
    //   walletDetails?.account_Reference,
    // );
    try {
      let response = await axios.get(
        `${api.fetchVirtualAccount}/${walletDetails?.account_Reference}`,
        config,
      );
      // DISABLED FOR PERFORMANCE
      // console.log('💳 Virtual account response:', response?.data);
      setVirtualAcctDetails(response?.data?.data[0]);
      // DISABLED FOR PERFORMANCE
      // console.log('✅ Virtual account loaded successfully');
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Virtual account error:', error?.response?.data);
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Virtual account error status:', error?.response?.status);
    }
  };

  const fetchAccountBalance = async () => {
    setLoadingBalance(true);
    try {
      let response = await axios.get(
        `${api.fecthAccountBalance}/${walletDetails?.account_Reference}?currency=NGN`,
        config,
      );
      // DISABLED FOR PERFORMANCE
      // console.log('wallet account balance', response);
      setGetBalance(response?.data?.data);
      setLoadingBalance(false);
      // // DISABLED FOR PERFORMANCE
      // console.log( 'movies array', response?.data?.data[3]?.genreId);
      // setMovieArray(response?.data?.data)
      // setLoading(false)
      // navigation.navigate('dashboard');
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log(' error  on wallet balance', error?.response);
      setLoadingBalance(false);
    }
  };
  const copyAccountNumber = accountNumber => {
    // Clipboard.setString(accountNumber);
    Alert.alert('Account number copied to clipboard');
  };
  return (
    <>
      <ScrollView
        style={{
          flex: 1,
          backgroundColor: '#353535',
          width: '100%',
          // marginTop: 10,
        }}
        refreshControl={
          <RefreshControl
            // titleColor='#fff'
            refreshing={loadingBalance}
            onRefresh={onRefresh}
            // title="Pull to refresh"
            colors={['white']} // Change the loading spinner color
          />
        }
      >
        <View style={styles.container}>
          <View style={styles.leftContainer}>
            <TouchableOpacity
              style={{ paddingHorizontal: 10 }}
              onPress={() => navigation.goBack()}
            >
              <Image source={require('../../../assets/icon.png')} />
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={styles.downloadsText}>Deposit</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View>
          {walletDetails === null ? (
            <View
              style={{
                justifyContent: 'center',
                alignItems: 'center',
                borderStartColor: '#353535',
                padding: 20,
              }}
            >
              <Text style={styles.label}>Wallet not initialized</Text>
              <Text
                style={[styles.text, { textAlign: 'center', marginTop: 10 }]}
              >
                Your wallet needs to be set up. This usually happens
                automatically when you first register.
              </Text>
              {loadingBalance ? (
                <ActivityIndicator size={'small'} color="white" />
              ) : (
                <View style={{ marginTop: 20 }}>
                  <Text onPress={() => onRefresh()} style={styles.link}>
                    Try to initialize wallet
                  </Text>
                  <Text
                    style={[
                      styles.text,
                      { textAlign: 'center', marginTop: 10, fontSize: 12 },
                    ]}
                  >
                    If this doesn't work, please contact support
                  </Text>
                </View>
              )}
            </View>
          ) : virtualAcctDetails?.staticAccountNumber?.length > 0 ? (
            <View style={{ padding: 20 }}>
              <Text
                style={{
                  color: 'white',
                  textAlign: 'center',
                  marginBottom: 100,
                }}
              >
                Copy the account number below and transfer into it to fund your
                Spred wallet.
              </Text>
              <View
                style={{
                  borderColor: '#F45303',
                  borderWidth: 1,
                  borderRadius: 20,
                  padding: 15,
                }}
              >
                <Text style={styles.label}>Currency</Text>
                <Text style={styles.text}>{virtualAcctDetails?.currency}</Text>

                <Text style={styles.label}>Bank Name</Text>
                <Text style={styles.text}>{virtualAcctDetails?.bankName}</Text>

                <Text style={styles.label}>Account number</Text>
                <View style={styles.accountNumberContainer}>
                  <Text style={styles.accountNumber}>
                    {virtualAcctDetails?.staticAccountNumber}
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      copyAccountNumber(virtualAcctDetails?.staticAccountNumber)
                    }
                  >
                    <View style={{ flexDirection: 'row' }}>
                      <MaterialIcons
                        name="content-copy"
                        size={18}
                        style={{ color: '#F45303' }}
                      />
                      <Text style={styles.copyButton}>Copy</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            <View
              style={{
                justifyContent: 'center',
                alignItems: 'center',
                borderStartColor: '#353535',
              }}
            >
              <Text style={styles.label}>
                Couldn't retrieve your virtual account details
              </Text>
              {loadingBalance ? (
                <ActivityIndicator size={'small'} color="white" />
              ) : (
                <Text onPress={() => onRefresh()} style={styles.link}>
                  Click here to try again
                </Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 60,
    padding: 10,
    flex: 1,
  },
  leftContainer: {
    flexDirection: 'row',
  },
  rightContainer: {
    flexDirection: 'row',
  },
  downloadsText: {
    color: '#FFFFFF',
    fontSize: 15,
    marginLeft: 10,
  },
  cardContainer: {
    marginVertical: 20,
  },

  card: {
    backgroundColor: '#F3E4DD',
    borderRadius: 10,
    marginVertical: 0,
    padding: 10,
    height: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    // marginLeft: 10,
    width: '80%',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#9D9D9D',
  },

  cardText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#F45303',
  },
  text: {
    fontSize: 16,
    marginTop: 5,
    color: '#fff',
  },
  link: {
    fontSize: 16,
    marginTop: 5,
    color: 'orange',
  },
  accountNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  accountNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  copyButton: {
    fontSize: 16,
    color: '#F45303',
    marginLeft: 0,
    textDecorationLine: 'underline',
  },
});

export default DepositScreen;
