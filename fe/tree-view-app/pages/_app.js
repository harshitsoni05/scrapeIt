import Layout from '../components/Layout'; // Import the Layout component
import '../styles/globals.css'; // Import your global CSS file

function MyApp({ Component, pageProps }) {
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}

export default MyApp;
