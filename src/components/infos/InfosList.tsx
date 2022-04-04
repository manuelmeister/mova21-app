import React, {useEffect, useRef, useState} from 'react';
import styled from 'styled-components/native';
import MovaHeadingText from '../generic/MovaHeadingText';
import {Animated, Easing, FlatList, RefreshControl, TouchableOpacity} from 'react-native';
import {useTranslation} from 'react-i18next';
import MovaTheme from '../../constants/MovaTheme';
import MovaText from '../generic/MovaText';
import MovaIcon from '../generic/MovaIcon';
import {StackNavigationProp} from '@react-navigation/stack';
import {IPage} from './IPage';
import {InfopagesStore} from "../../stores/InfopagesStore";
import LanguageSwitcher from "./LanguageSwitcher";
import { useIsFocused } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

const MainContainer = styled.SafeAreaView`
  background-color: #fff;
  flex: 1;
`;

const InfosItem = styled.View`
  padding: 10px;
`;

const InfosHeader = styled.View`
  padding: 10px;
  margin-top: 10px;
  flex-direction: row;
`;

const SearchBar = styled.View`
  flex-direction: row;
  height: 56px;
  align-content: center;
  align-items: center;
  justify-content: space-between;
`;

const SearchInput = styled.TextInput`
  font-size: 32px;
  border-bottom-width: 2px;
  border-color: black;
  margin-top: -10px;
  margin-left: 10px;
  height: 60px;
  flex-grow: 1;
`;

const MovaAnimatedHeadingText = Animated.createAnimatedComponent(MovaHeadingText);

type NavigationProp = StackNavigationProp<
  {infopage: {page: IPage}},
  'infopage'
>;

function mainPageFilter(page: IPage) : boolean {
  return page.sub_page === false;
}

function mainPages() : IPage[] {
  return InfopagesStore.get().filter(mainPageFilter);
}

export default function InfosList({navigation}: {navigation: NavigationProp}) {
  const {t} = useTranslation();

  const [pages, setPages] = useState<IPage[]>([]);
  const [isRefreshing, setRefreshing] = useState<boolean>(false);

  const [isSearchActive, setSearching] = useState<boolean>(false);
  const [searchKeyword, setSearchKeyword] = useState("");

  const animationProgress = useRef(new Animated.Value(0)).current;

  // load on mount
  useEffect(() => {
    setPages(mainPages());
    const subscription = InfopagesStore.subscribe((pages: IPage[]) => {
      setPages(pages.filter(mainPageFilter));
    })
    InfopagesStore.reload();
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const isFocused = useIsFocused();

  if (isSearchActive && !isFocused) {
    leaveSearch();
  }

  function onRefresh() {
    setRefreshing(true);
    InfopagesStore.reload().then(() => {
      setPages(mainPages());
      setRefreshing(false);
    });
  }

  function getColor(item: IPage, index: number): string {
    if (item.list_color && item.list_color.length === 7 && item.list_color[0] === '#') {
      return item.list_color;
    }
    return index % 2 ? MovaTheme.colorBlue : MovaTheme.colorYellow;
  }

  function enterSearch() {
    Animated.timing(animationProgress, {
      toValue: 1,
      duration: 400,
      useNativeDriver: false,
      easing: Easing.out(Easing.circle),
    }).start(
      () => {
        setSearching(true);
        animationProgress.setValue(0);
      }
    );
  };

  function leaveSearch() {
    onNewSearchKeyword('');
    setSearching(false);
    animationProgress.setValue(1);
    Animated.timing(animationProgress, {
      toValue: 0,
      duration: 400,
      useNativeDriver: false,
      easing: Easing.out(Easing.circle),
    }).start();
  };

  function onNewSearchKeyword(keyword: string) {
    setSearchKeyword(keyword);
    if (keyword === '') {
      setPages(mainPages());
      return;
    }
    // Search shows all pages, including sub pages
    let pages = InfopagesStore.get();
    if (isSearchActive && typeof keyword != 'undefined' && keyword) {
      const sanitized = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regexp = new RegExp(sanitized, 'i');
      pages = pages.filter((page) =>
        regexp.test(page.title) || regexp.test(page.content)
      );
    }
    setPages(pages);
  }

  return (
    <MainContainer>
      <FlatList
        data={pages}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            onPress={() => navigation.navigate('infopage', { page: item })}>
            <InfosItem
              style={{
                backgroundColor: getColor(item, index)
              }}>
              <MovaText style={{ fontSize: 40 }}>{item.title}</MovaText>
            </InfosItem>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={
          <InfosHeader>
            {!isSearchActive &&
              <MovaAnimatedHeadingText
                style={[MovaHeadingText.style, {
                  flex: animationProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 0.00001]
                  }),
                  opacity: animationProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 0.5]
                  }),
                  fontSize: animationProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [40, 1]
                  }),
                }]}
              >
                {t('info')}
              </MovaAnimatedHeadingText>
            }
            <SearchBar
              style={isSearchActive ? { flexGrow: 1 } : {}}
            >
              <MovaIcon
                name='search-outline'
                size={50}
                color='black'
                onPress={() => isSearchActive ? leaveSearch() : enterSearch()}
              />
              {isSearchActive &&
                <SearchInput
                  onChangeText={onNewSearchKeyword}
                  value={searchKeyword}
                  placeholder={t('search_keyword')}
                />
              }
              {isSearchActive &&
                <Icon
                  name={'close-sharp'}
                  size={40}
                  color='black'
                  onPress={() => onNewSearchKeyword('')}
                  style={{ paddingBottom: 12, paddingLeft: 10 }}
                />
              }
            </SearchBar>
          </InfosHeader>
        }
        ListFooterComponent={
          <LanguageSwitcher />
        }
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      />
    </MainContainer>
  );
}
