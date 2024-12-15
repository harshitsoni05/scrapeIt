import { useRouter } from 'next/router';
import DocumentEditor from '../components/DocumentEditor';

const DocumentPage = () => {
  const router = useRouter();
  const { docId } = router.query;

  if (!docId) return <p>Loading..iufgyi.</p>;

  return <DocumentEditor docId={docId as string} />;
};

export default DocumentPage;
