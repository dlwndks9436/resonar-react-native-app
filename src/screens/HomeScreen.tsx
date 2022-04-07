import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ListRenderItem,
  ImageBackground,
} from 'react-native';
import {ActivityIndicator, Button, Text, Title} from 'react-native-paper';
import Api from '../libs/api';
import {useAppSelector} from '../redux/hooks';
import {selectAccessToken} from '../features/user/userSlice';
import {AxiosError, AxiosResponse} from 'axios';
import {SafeAreaView} from 'react-native-safe-area-context';
import {convertUnit, formatDuration, getElapsedTime} from '../utils/index';
import {RootStackTabScreenProps} from '../types/type';
import {PressableOpacity} from 'react-native-pressable-opacity';

export default function HomeScreen({navigation}: RootStackTabScreenProps) {
  interface Practice {
    _id?: number;
    user_id?: number;
    title?: string;
    description?: string;
    duration?: number;
    from_directory?: string;
    practice_time?: number;
    s3_key?: string;
    user: {username: string};
    thumbnailUri?: string;
    views?: string | number;
    createdAt?: string;
  }
  interface PracticeQueryResult {
    totalItems: number;
    practices: Practice[];
    totalPages: number;
    currentPage: number;
    thumbnailURLs: string[];
  }

  const [loading, setLoading] = useState(true);
  const [startMount, setStartMount] = useState(false);
  const [serverData, setServerData] = useState<Practice[]>([]);
  const [thumbnailUrls, setThumbnailUrls] = useState<string[]>([]);
  const [fetching, setFetching] = useState(false);
  const [isRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const accessToken = useAppSelector(selectAccessToken);
  // const [title] = useState();
  // const [username] = useState();
  const [search] = useState('');
  const [searchType] = useState<'title' | 'username'>();

  const componentDidMount = useCallback(async () => {
    setStartMount(true);
    const params: {
      page: number;
      size: number;
      title?: string;
      username?: string;
    } = {page: 0, size: 10};
    if (search) {
      if (searchType === 'title') {
        params.title = search;
      } else if (searchType === 'username') {
        params.username = search;
      }
    }

    console.log('componentDidMount start');

    await Api.get('practice', {
      headers: {Authorization: 'Bearer ' + accessToken},
      params,
    })
      .then((response: AxiosResponse) => response.data)
      .then((data: PracticeQueryResult) => {
        console.log('initial loading successfully done');
        console.log('loaded practices: ', data.practices);
        console.log('loaded thumbnails: ', data.thumbnailURLs);

        setPage(currentPage => currentPage + 1);
        setServerData(data.practices);
        setThumbnailUrls(data.thumbnailURLs);
        setLoading(false);
      })
      .catch((err: AxiosError) => {
        console.error('componentDidMount api error: ', err.response?.data);
        setLoading(false);
      });
  }, [accessToken, search, searchType]);

  useEffect(() => {
    console.log('start use effect');
    if (!startMount) {
      console.log('start mount function');
      componentDidMount();
    }
  }, [componentDidMount, startMount]);

  useEffect(() => {
    console.log('server data: ', serverData);
  }, [serverData]);

  const loadMoreData = async () => {
    setFetching(true);
    const params: {
      page: number;
      size: number;
      title?: string;
      username?: string;
    } = {page, size: 10};
    if (search) {
      if (searchType === 'title') {
        params.title = search;
      } else if (searchType === 'username') {
        params.username = search;
      }
    }
    await Api.get('practice', {
      headers: {Authorization: 'Bearer ' + accessToken},
      params,
    })
      .then((response: AxiosResponse) => response.data)
      .then((data: PracticeQueryResult) => {
        setPage(currentPage => currentPage + 1);
        setServerData(serverData.concat(data.practices));
        setThumbnailUrls(thumbnailUrls.concat(data.thumbnailURLs));
        setFetching(false);
      })
      .catch(err => console.log(err));
    setFetching(false);
  };

  const navigateToPracticeScreen = (id: number) => {
    navigation.navigate('ViewPractice', {practiceId: id});
  };

  const Item = ({
    _id,
    title,
    thumbnailUri,
    duration,
    user,
    createdAt,
    views,
  }: Practice) => (
    <PressableOpacity
      style={styles.itemContainer}
      onPress={() => {
        navigateToPracticeScreen(_id!);
      }}>
      <ImageBackground
        style={styles.thumbnailContainer}
        imageStyle={styles.thumbnail}
        source={{uri: thumbnailUri}}>
        <View style={styles.durationTextPosition}>
          <Text style={styles.duration}>
            {duration && formatDuration(duration)}
          </Text>
        </View>
      </ImageBackground>
      <Title style={styles.title}>{title}</Title>
      <View style={styles.textContainer}>
        <Text style={styles.itemText}>{user.username}</Text>
        <Text style={styles.itemText}>{views} views</Text>
        <Text style={styles.itemText}>{createdAt}</Text>
      </View>
    </PressableOpacity>
  );

  const renderItem: ListRenderItem<Practice> = ({item, index}) => {
    const date = Date.parse(item.createdAt!);
    const createdAt = getElapsedTime(date);
    const views = convertUnit(item.views as number) || '0';
    return (
      <Item
        _id={item._id}
        title={item.title}
        key={item._id}
        duration={item.duration}
        thumbnailUri={thumbnailUrls[index]}
        user={item.user}
        views={views}
        createdAt={createdAt}
      />
    );
  };

  const renderFooter = () => {
    return (
      <View style={styles.footer}>
        <Button
          onPress={loadMoreData}
          style={styles.loadMoreBtn}
          labelStyle={styles.btnText}
          loading={fetching}
          disabled={fetching}>
          {fetching ? null : 'Load more'}
        </Button>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" />
      ) : serverData.length === 0 ? (
        <Button onPress={componentDidMount}>Load practice</Button>
      ) : (
        <FlatList
          style={{width: '100%'}}
          data={serverData}
          renderItem={renderItem}
          keyExtractor={(_item, index) => index.toString()}
          onEndReached={loadMoreData}
          onEndReachedThreshold={0.1}
          ListFooterComponent={renderFooter}
          onRefresh={componentDidMount}
          refreshing={isRefreshing}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  itemContainer: {
    padding: 20,
  },
  title: {
    fontSize: 20,
    paddingHorizontal: 10,
    marginTop: 5,
  },
  duration: {
    backgroundColor: '#000000bb',
    padding: 5,
    color: 'white',
  },
  thumbnailContainer: {
    height: 200,
    width: '100%',
  },
  thumbnail: {borderRadius: 10},
  durationTextPosition: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  loadMoreBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: 40,
  },
  btnText: {
    fontSize: 15,
    textAlign: 'center',
  },
  footer: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    width: '100%',
  },
  textContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  itemText: {
    fontSize: 15,
    paddingRight: 10,
    marginBottom: 5,
  },
});
