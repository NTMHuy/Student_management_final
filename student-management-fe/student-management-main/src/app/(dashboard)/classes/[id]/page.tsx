import ClassDetailPage from '@/modules/class/components/ClassDetailPage';

export default function Page({ params }: { params?: { id: string } }) {
  return <ClassDetailPage params={params} />;
}
