import Demo from '@components/demo/Index';
import { formatDate } from '@tzc/libs';
import { memo } from 'react';

const date = formatDate(new Date(), { locale: 'zh-CN' });
console.log('Current date and time:', date);

const Home = () => {
	return <Demo />;
};

export default memo(Home);
