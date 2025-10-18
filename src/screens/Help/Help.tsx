import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  // Clipboard,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const Help = () => {
  const navigation = useNavigation();
  const [expandedFAQs, setExpandedFAQs] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const helpSections = [
    {
      title: 'Getting Started',
      icon: 'rocket1',
      items: ['Creating Your Account', 'Signing In', 'Setting Up Your Profile'],
      description: 'Learn the basics of using Spred',
    },
    {
      title: 'Content Purchase & Resale',
      icon: 'shoppingcart',
      items: [
        'How to Purchase Content',
        'Downloading for Offline Viewing',
        'Becoming a Reseller',
        'Setting Resale Prices',
        'Peer-to-Peer Sharing',
      ],
      description: 'Buy, download, and resell content',
    },
    {
      title: 'Wallet & Payments',
      icon: 'wallet',
      items: [
        'Adding Funds (Nigerian Naira)',
        'Spred Tokens (1 NGN = 10 Tokens)',
        'Transferring Tokens',
        'Payment Methods',
      ],
      description: 'Manage your funds and transactions',
    },
    {
      title: 'Subscription Plans',
      icon: 'staro',
      items: [
        'Free Tier (Ad-supported)',
        'Premium (₦500/month)',
        'Pro (₦1000/month)',
        'Reseller Benefits',
      ],
      description: 'Explore our subscription options',
    },
    {
      title: 'Troubleshooting',
      icon: 'exclamationcircle',
      items: [
        "Video Won't Play",
        'Download Issues',
        'Spred Sharing Problems',
        'Payment Issues',
        'Account Problems',
      ],
      description: 'Solve common issues',
    },
  ];

  const faqs = [
    {
      question: 'How do I become a reseller?',
      answer:
        'Subscribe to Premium or Pro, purchase content, and start sharing with others in your community to earn tokens. You can set your own resale prices and earn a percentage of each sale.',
    },
    {
      question: "What's the difference between free and paid content?",
      answer:
        'Free content is ad-supported streaming only. Paid content can be downloaded and resold to others. Paid content also offers higher quality streaming and additional features.',
    },
    {
      question: 'How much can I earn as a reseller?',
      answer:
        'Earnings depend on your resale volume and pricing. Pro subscribers get higher profit margins. Top resellers can earn up to 70% commission on their sales.',
    },
    {
      question: 'How do I download content for offline viewing?',
      answer:
        "Purchase or resell content first, then go to your library and tap the download button. Content can only be downloaded on devices you've registered.",
    },
    {
      question: 'Can I watch content on multiple devices?',
      answer:
        'Yes, Premium and Pro subscribers can register up to 5 devices. Free tier users can only use 1 device at a time.',
    },
    {
      question: 'How do I cancel my subscription?',
      answer:
        'Go to Account Settings > Subscription > Cancel Subscription. Your subscription will remain active until the end of the current billing period.',
    },
  ];

  // Knowledge base articles
  const knowledgeBase = [
    {
      category: 'Account Management',
      articles: [
        {
          title: 'How to reset your password',
          readTime: '2 min read',
          url: 'https://spred.cc/help/account/reset-password',
        },
        {
          title: 'Updating your profile information',
          readTime: '3 min read',
          url: 'https://spred.cc/help/account/update-profile',
        },
        {
          title: 'Linking social media accounts',
          readTime: '2 min read',
          url: 'https://spred.cc/help/account/link-social',
        },
      ],
    },
    {
      category: 'Technical Issues',
      articles: [
        {
          title: 'Fixing video playback issues',
          readTime: '4 min read',
          url: 'https://spred.cc/help/technical/video-playback',
        },
        {
          title: 'Troubleshooting download failures',
          readTime: '3 min read',
          url: 'https://spred.cc/help/technical/download-issues',
        },
        {
          title: 'Resolving app crashes',
          readTime: '2 min read',
          url: 'https://spred.cc/help/technical/app-crashes',
        },
      ],
    },
    {
      category: 'Billing & Payments',
      articles: [
        {
          title: 'Understanding subscription charges',
          readTime: '3 min read',
          url: 'https://spred.cc/help/billing/subscriptions',
        },
        {
          title: 'Refund policy and process',
          readTime: '4 min read',
          url: 'https://spred.cc/help/billing/refunds',
        },
        {
          title: 'Changing payment methods',
          readTime: '2 min read',
          url: 'https://spred.cc/help/billing/payment-methods',
        },
      ],
    },
  ];

  // Support information
  const supportInfo = {
    email: 'support@spred.cc',
    phone: '+234 800 123 4567',
    chatHours: 'Monday - Friday: 9:00 AM - 6:00 PM WAT',
    responseTimes: {
      email: 'Within 24 hours',
      chat: 'Within 2 hours (during business hours)',
      phone: 'Immediate (during business hours)',
    },
    holidays: 'Closed on public holidays',
  };

  const socialLinks = [
    { name: 'Twitter', icon: 'message1', url: 'https://twitter.com/spredapp' },
    { name: 'Facebook', icon: 'user', url: 'https://facebook.com/spredapp' },
    {
      name: 'Instagram',
      icon: 'camerao',
      url: 'https://instagram.com/spredapp',
    },
    { name: 'YouTube', icon: 'youtube', url: 'https://youtube.com/spredapp' },
  ];

  const toggleFAQ = index => {
    if (expandedFAQs.includes(index)) {
      setExpandedFAQs(expandedFAQs.filter(item => item !== index));
    } else {
      setExpandedFAQs([...expandedFAQs, index]);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const contactSupport = method => {
    switch (method) {
      case 'email':
        Linking.openURL(`mailto:${supportInfo.email}?subject=Support Request`);
        break;
      case 'phone':
        Linking.openURL(`tel:${supportInfo.phone.replace(/\s/g, '')}`);
        break;
      case 'chat':
        Alert.alert(
          'Live Chat',
          `Our support team is available ${supportInfo.chatHours}. Would you like to start a chat session?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Start Chat',
              onPress: () => Linking.openURL('https://spred.cc/chat'),
            },
          ],
        );
        break;
      default:
        break;
    }
  };

  const openKnowledgeBaseArticle = (url, title) => {
    Alert.alert(
      'Open Article',
      `Would you like to open "${title}" in your browser?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open', onPress: () => Linking.openURL(url) },
      ],
    );
  };

  const openCommunityForum = () => {
    Linking.openURL('https://community.spred.cc');
  };

  const submitFeedback = () => {
    Linking.openURL(
      `mailto:${supportInfo.email}?subject=App Feedback&body=Please describe your feedback or suggestion here...`,
    );
  };

  const copyToClipboard = (text, label) => {
    // Clipboard.setString(text);
    Alert.alert('Copied', `${label} copied to clipboard`);
  };

  const openSocialLink = (url, name) => {
    Alert.alert(
      `Follow us on ${name}`,
      `Would you like to open our ${name} page in your browser?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open', onPress: () => Linking.openURL(url) },
      ],
    );
  };

  const openTermsOfService = () => {
    Linking.openURL('https://spred.cc/terms');
  };

  const openPrivacyPolicy = () => {
    Linking.openURL('https://spred.cc/privacy');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Help & Support</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#F45303"
          />
        }
      >
        <View style={styles.welcomeCard}>
          <MaterialIcons name="help-outline" size={48} color="#F45303" />
          <Text style={styles.welcomeTitle}>How can we help you?</Text>
          <Text style={styles.welcomeText}>
            Find answers to common questions or contact our support team
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => contactSupport('chat')}
          >
            <MaterialIcons name="message" size={24} color="#F45303" />
            <Text style={styles.quickActionText}>Live Chat</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => contactSupport('phone')}
          >
            <MaterialIcons name="phone" size={24} color="#F45303" />
            <Text style={styles.quickActionText}>Call Us</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => contactSupport('email')}
          >
            <MaterialIcons name="email" size={24} color="#F45303" />
            <Text style={styles.quickActionText}>Email</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={openCommunityForum}
          >
            <MaterialIcons name="group" size={24} color="#F45303" />
            <Text style={styles.quickActionText}>Community</Text>
          </TouchableOpacity>
        </View>

        {/* Help Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Help Categories</Text>
          {helpSections.map((section, index) => (
            <TouchableOpacity
              key={index}
              style={styles.helpCategory}
              onPress={() =>
                Alert.alert(
                  section.title,
                  `${section.description}\n\nThis would navigate to the ${section.title} help section.`,
                  [
                    { text: 'Close', style: 'cancel' },
                    {
                      text: 'View Topics',
                      onPress: () => {
                        // DISABLED FOR PERFORMANCE
                        // console.log('View topics for', section.title);
                      },
                    },
                  ],
                )
              }
            >
              <View style={styles.categoryLeft}>
                <View style={styles.categoryIconContainer}>
                  <MaterialIcons
                    name={
                      section.icon === 'rocket1'
                        ? 'rocket-launch'
                        : section.icon === 'shoppingcart'
                        ? 'shopping-cart'
                        : section.icon === 'wallet'
                        ? 'account-balance-wallet'
                        : section.icon === 'staro'
                        ? 'star-border'
                        : section.icon === 'exclamationcircle'
                        ? 'error-outline'
                        : section.icon
                    }
                    size={20}
                    color="#F45303"
                  />
                </View>
                <View>
                  <Text style={styles.categoryTitle}>{section.title}</Text>
                  <Text style={styles.categoryDescription}>
                    {section.description}
                  </Text>
                </View>
              </View>
              <MaterialIcons name="arrow-forward" size={20} color="#999" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Contact Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Support</Text>

          <View style={styles.supportInfoCard}>
            <Text style={styles.supportInfoTitle}>Support Hours</Text>
            <Text style={styles.supportInfoText}>{supportInfo.chatHours}</Text>
            <Text style={styles.supportInfoText}>{supportInfo.holidays}</Text>

            <View style={styles.responseTimes}>
              <View style={styles.responseTimeRow}>
                <Text style={styles.responseTimeLabel}>Email:</Text>
                <Text style={styles.responseTimeValue}>
                  {supportInfo.responseTimes.email}
                </Text>
              </View>
              <View style={styles.responseTimeRow}>
                <Text style={styles.responseTimeLabel}>Live Chat:</Text>
                <Text style={styles.responseTimeValue}>
                  {supportInfo.responseTimes.chat}
                </Text>
              </View>
              <View style={styles.responseTimeRow}>
                <Text style={styles.responseTimeLabel}>Phone:</Text>
                <Text style={styles.responseTimeValue}>
                  {supportInfo.responseTimes.phone}
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.contactItem}
            onPress={() => contactSupport('email')}
          >
            <View style={styles.contactIconContainer}>
              <MaterialIcons name="email" size={20} color="#fff" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>Email Support</Text>
              <Text style={styles.contactDetail}>{supportInfo.email}</Text>
            </View>
            <TouchableOpacity
              onPress={() =>
                copyToClipboard(supportInfo.email, 'Email address')
              }
            >
              <MaterialIcons name="content-copy" size={20} color="#999" />
            </TouchableOpacity>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactItem}
            onPress={() => contactSupport('phone')}
          >
            <View style={styles.contactIconContainer}>
              <MaterialIcons name="phone" size={20} color="#fff" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>Phone Support</Text>
              <Text style={styles.contactDetail}>{supportInfo.phone}</Text>
            </View>
            <TouchableOpacity
              onPress={() => copyToClipboard(supportInfo.phone, 'Phone number')}
            >
              <MaterialIcons name="content-copy" size={20} color="#999" />
            </TouchableOpacity>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactItem}
            onPress={() => contactSupport('chat')}
          >
            <View style={styles.contactIconContainer}>
              <MaterialIcons name="message" size={20} color="#fff" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>Live Chat</Text>
              <Text style={styles.contactDetail}>{supportInfo.chatHours}</Text>
            </View>
            <MaterialIcons name="arrow-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Knowledge Base */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Knowledge Base</Text>
            <TouchableOpacity
              onPress={() => Linking.openURL('https://spred.cc/help')}
            >
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {knowledgeBase.map((category, categoryIndex) => (
            <View key={categoryIndex} style={styles.knowledgeCategory}>
              <Text style={styles.categoryTitle}>{category.category}</Text>
              {category.articles.map((article, articleIndex) => (
                <TouchableOpacity
                  key={articleIndex}
                  style={styles.articleItem}
                  onPress={() =>
                    openKnowledgeBaseArticle(article.url, article.title)
                  }
                >
                  <Text style={styles.articleTitle}>{article.title}</Text>
                  <View style={styles.articleRight}>
                    <Text style={styles.articleReadTime}>
                      {article.readTime}
                    </Text>
                    <MaterialIcons
                      name="arrow-forward"
                      size={20}
                      color="#999"
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          {faqs.map((faq, index) => (
            <TouchableOpacity
              key={index}
              style={styles.faqItem}
              onPress={() => toggleFAQ(index)}
            >
              <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>{faq.question}</Text>
                <MaterialIcons
                  name={
                    expandedFAQs.includes(index)
                      ? 'keyboard-arrow-up'
                      : 'keyboard-arrow-down'
                  }
                  size={20}
                  color="#999"
                />
              </View>
              {expandedFAQs.includes(index) && (
                <Text style={styles.faqAnswer}>{faq.answer}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Feedback Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Feedback</Text>
          <View style={styles.feedbackContainer}>
            <Text style={styles.feedbackText}>
              Help us improve your experience
            </Text>
            <TouchableOpacity
              style={styles.feedbackButton}
              onPress={submitFeedback}
            >
              <Text style={styles.feedbackButtonText}>Send Feedback</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Legal Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          <View style={styles.legalLinks}>
            <TouchableOpacity
              onPress={openTermsOfService}
              style={styles.legalLink}
            >
              <Text style={styles.legalLinkText}>Terms of Service</Text>
              <MaterialIcons name="arrow-forward" size={16} color="#999" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={openPrivacyPolicy}
              style={styles.legalLink}
            >
              <Text style={styles.legalLinkText}>Privacy Policy</Text>
              <MaterialIcons name="arrow-forward" size={16} color="#999" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 50,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  welcomeCard: {
    backgroundColor: '#2A2A2A',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#333333',
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 14,
    color: '#CCCCCC',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  helpCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2A2A2A',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(244, 83, 3, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  categoryDescription: {
    fontSize: 12,
    color: '#8B8B8B',
    marginTop: 2,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2A2A2A',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  contactIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(244, 83, 3, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  contactDetail: {
    fontSize: 14,
    color: '#CCCCCC',
    marginTop: 2,
  },
  faqItem: {
    backgroundColor: '#2A2A2A',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
    marginRight: 12,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  feedbackContainer: {
    backgroundColor: '#2A2A2A',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  feedbackText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  feedbackButton: {
    backgroundColor: '#F45303',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  feedbackButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  bottomSpacing: {
    height: 20,
  },

  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },

  quickAction: {
    backgroundColor: '#2A2A2A',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#333333',
  },

  quickActionText: {
    fontSize: 12,
    color: '#fff',
    marginTop: 8,
    textAlign: 'center',
  },

  supportInfoCard: {
    backgroundColor: '#2A2A2A',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },

  supportInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },

  supportInfoText: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 4,
  },

  responseTimes: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },

  responseTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  responseTimeLabel: {
    fontSize: 14,
    color: '#8B8B8B',
  },

  responseTimeValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  viewAllText: {
    fontSize: 14,
    color: '#F45303',
    fontWeight: '600',
  },

  knowledgeCategory: {
    marginBottom: 20,
  },

  articleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },

  articleTitle: {
    fontSize: 14,
    color: '#fff',
    flex: 1,
  },

  articleRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  articleReadTime: {
    fontSize: 12,
    color: '#8B8B8B',
    marginRight: 8,
  },

  legalLinks: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333333',
  },

  legalLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },

  legalLinkText: {
    fontSize: 16,
    color: '#fff',
  },
});

export default Help;
